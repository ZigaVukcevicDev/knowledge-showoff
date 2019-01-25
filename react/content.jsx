'use strict';
require('./content.scss');

import React from 'react';
import { classNameFactory, didPropsChange, useContext, translateReact as t } from '../../../utils/component';
import TotalDistanceChart from '../common/charts/totalDistanceChart';
import GameSeasonalTabs from '../../../components/nfl/tabs/gameSeasonal';
import { PlayerMenuAndImage, PlayerStats, PlayerRank } from '../common/playerMetrics';
import get from 'lodash/get';
import { replaceTextAdv } from '../../../utils/replaceTextAdv';
import Crest from '../../../components/nfl/crest';

const BBName = 'player-total-distance-content';
const c = classNameFactory(BBName);

@useContext()
class TotalDistanceContent extends React.Component {
  static propTypes = {
    playerObjects: React.PropTypes.object, // Arrays of players, keyed by positions, usually "injected" by feed
    week: React.PropTypes.number, // Optional week number, usually "injected" by feed, we forward it via setState if it is available
    playerObject: React.PropTypes.object,
    type: React.PropTypes.oneOf(['season', 'game']).isRequired, // Season: only season data, game: season+game data (a "switcher tab" is shown)
    seasonId: React.PropTypes.number
  };

  componentWillMount() {
    this.setState({ timeFrame: this.props.type === 'game' ? 'game' : 'season' });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return didPropsChange(this.props, nextProps) || didPropsChange(this.state, nextState);
  }

  onTabClick = (id) => {
    // Id is either 'season' or 'game'
    this.setState({ timeFrame: id });
  };

  render() {
    const { playerObjects, playerObject, type, seasonId, teamId, positionId, playerId, week, setState } = this.props;
    const timeFrame = this.state.timeFrame;
    // NOTE: TotalDistanceChart is keyed, which causes instantiation of a
    // new chart each time a player or time-frame changes, which in turn
    // gives us the desired effect to animate to the value starting from 0,
    // and not from the last value displayed
    return (
      <div className={ c(['container']) }>
        {/* Player selection & display + stats */}
        <div className={ c(['container-stats']) }>
          <PlayerMenuAndImage
              playerObjects={ playerObjects }
              teamId={ teamId }
              week={ week }
              positionId={ positionId }
              playerId={ playerId }
              setState={ setState }
          />
          <div className={ c(['data']) }>
            <PlayerRank
                title={ replaceTextAdv(t(this, 'nfl_distance_rank'), {year: seasonId}, 0) }
                playerObject={ playerObject }
                timeFrame={ 'season' }
                positionId={ positionId }
            />
            <PlayerStats
                title={ replaceTextAdv(t(this, 'nfl_season_stats'), {year: seasonId}, 0) }
                seasonId={ seasonId }
                playerObject={ playerObject }
                positionId={ positionId }
                className={ c(['stats']) }
            />
          </div>
          <Crest id={ this.props.teamId } size="medium" className={ c(['crest']) } />
        </div>
        {/* Chart */}
        <div className={ c(['container-chart']) }>
          <div className={ c(['heading']) }>
            <div className={ c(['tabs']) }>
              <If condition={ type === 'game' }>
                <GameSeasonalTabs iconNumber={ week } onClick={ this.onTabClick } />
              </If>
            </div>
            <div className={ c(['title']) }>{ replaceTextAdv(t(this, 'nfl_total_distance_in_season'), {year: seasonId}, 0) }</div>
          </div>
          <TotalDistanceChart
            playerObject={ playerObject }
            timeFrame={ timeFrame }
            gamesPlayed={ week }
            key={ timeFrame + '-' + get(playerObject, ['player', 'id'], 'nothing') }
            className={ c(['chart']) }
            classes={{
              'legend-container': c(['legend']),
              'legend-frame': c(['legend-frame']),
              'legend-distance-line2': c(['legend-distance-line2']),
              'legend-distance-line3-outside': c(['legend-distance-line3-outside']),
              'legend-contribution-line2': c(['legend-contribution-line2'])
            }}
          />
        </div>
      </div>
    );
  }
}

export default TotalDistanceContent;
