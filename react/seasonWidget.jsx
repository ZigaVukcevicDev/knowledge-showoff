'use strict';
require('./widget.scss');

import React from 'react';
import { buildingBlock, classNameFactory, didPropsChange, translateReact as t } from '../../../utils/component';
import { error } from '../../../utils/log';
import WidgetHeader from '../common/widgetHeader';
import { Menus, FetchSeasonTeams, FetchSeasonTeamPlayersStats } from '../common/playerMetrics';
import TotalDistanceContent from './content';

const BBName = 'player-total-distance-season';
const c = classNameFactory(BBName);
const responsiveConfig = {
  typeKey: BBName,
  config: {
    small: {
      width: '-640',
      classes: 'sr-small sr-player-stats-chart-content-small sr-player-total-distance-chart-small sr-player-total-distance-content-small ' +
        'sr-player-metrics-player-menu-image-small'
    },
    large: {
      width: '640-',
      classes: 'sr-large sr-player-stats-chart-content-large sr-player-total-distance-chart-large sr-player-total-distance-content-large ' +
        'sr-player-metrics-player-menu-image-large'
    }
  }
};

@buildingBlock(BBName, responsiveConfig)
class PlayerTotalDistanceSeason extends React.Component {
  static propTypes = {
    seasonId: React.PropTypes.number.isRequired,
    seasonType: React.PropTypes.string.isRequired,
    teamId: React.PropTypes.string, // Required if disableTeamMenu || disableTeamAndPlayerMenu
    positionId: React.PropTypes.string, // Can be derived from playerId
    playerId: React.PropTypes.string, // Either playerId or positionId is required if disableTeamMenu || disableTeamAndPlayerMenu
    disableTeamMenu: React.PropTypes.bool,
    disableTeamAndPlayerMenu: React.PropTypes.bool
  };

  componentWillMount() {
    this.setStateBound = this.setState.bind(this);
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { teamId, playerId, positionId } = nextProps;
    this.setState({teamId, playerId, positionId});
  }

  shouldComponentUpdate(nextProps, nextState) {
    return didPropsChange(this.props, nextProps) || didPropsChange(this.state, nextState);
  }

  render() {
    const { seasonId, seasonType, disableTeamMenu, disableTeamAndPlayerMenu } = this.props;
    const { teamId, positionId, playerId, playerObject } = this.state;

    if (!seasonId) {
      error('[PlayerTotalDistanceSeason] seasonId is missing!');
    }
    if (!seasonType) {
      error('[PlayerTotalDistanceSeason] seasonType is missing!');
    }
    if (disableTeamAndPlayerMenu && (!teamId || !(playerId || positionId))) {
      // If teamId is not present, then we don't know players of what team to fetch
      // If playerId is not present, then we don't know players of what position to display in PlayerStatsChart menu
      error('[PlayerTotalDistanceSeason] Team and Player menus are disabled, but teamId and/or playerId were not provided!');
    }
    else if (disableTeamMenu && !teamId) {
      error('[PlayerTotalDistanceSeason] Team menu is disabled, but teamId was not provided!');
    }

    return (
      <div className={ c(['container'], 'srt-base-1') }>
        <WidgetHeader title={ t(this, 'nfl_player_total_distance') } className={ c(['title']) } />
        {/* Optional menus */}
        <If condition={ !disableTeamAndPlayerMenu }>
          <FetchSeasonTeams seasonId={ seasonId } seasonType={ seasonType } key={ 'season-teams' }>
            <Menus
              seasonId={ seasonId }
              teamId={ teamId }
              positionId={ positionId }
              playerId={ playerId }
              disableTeamMenu={ disableTeamMenu }
              setState={ this.setStateBound }
            />
          </FetchSeasonTeams>
        </If>
        {/* Stats + chart */}
        <FetchSeasonTeamPlayersStats seasonId={ seasonId } teamId={ teamId } key={ 'season-stats' }>
          <TotalDistanceContent
            playerObject={ playerObject }
            type={ 'season' }
            seasonId={ seasonId }
            teamId={ teamId }
            positionId={ positionId }
            playerId={ playerId }
            setState={ this.setStateBound }
          />
        </FetchSeasonTeamPlayersStats>
      </div>
    );
  }
}

export default PlayerTotalDistanceSeason;
