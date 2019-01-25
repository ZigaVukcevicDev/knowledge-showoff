'use strict';
require('./widget.scss');

import React from 'react';
import { buildingBlock, classNameFactory, didPropsChange, translateReact as t } from '../../../utils/component';
import { error } from '../../../utils/log';
import WidgetHeader from '../common/widgetHeader';
import { Menus, FetchWeekTeams, FetchGamePlayersStats } from '../common/playerMetrics';
import TotalDistanceContent from './content';

const BBName = 'player-total-distance-game';
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
class PlayerTotalDistanceGame extends React.Component {
  static propTypes = {
    seasonId: React.PropTypes.number.isRequired,
    seasonType: React.PropTypes.string.isRequired,
    teamId: React.PropTypes.string, // Required if disableTeamMenu || disableTeamAndPlayerMenu
    positionId: React.PropTypes.string, // Can be derived from playerId
    playerId: React.PropTypes.string, // Either playerId or positionId is required if disableTeamMenu || disableTeamAndPlayerMenu
    week: React.PropTypes.number, // Can be derived from matchId, required if matchId is not provided
    matchId: React.PropTypes.string, // Can be derived from teamId and week, if menus are not disabled
    disableTeamMenu: React.PropTypes.bool,
    disableTeamAndPlayerMenu: React.PropTypes.bool
  };

  componentWillMount() {
    this.setStateBound = this.setState.bind(this);
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    const { teamId, playerId, positionId, matchId } = nextProps;
    this.setState({ teamId, playerId, positionId, matchId });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return didPropsChange(this.props, nextProps) || didPropsChange(this.state, nextState);
  }

  render() {
    const { seasonId, seasonType, week, disableTeamMenu, disableTeamAndPlayerMenu } = this.props;
    const { teamId, positionId, playerId, matchId, playerObject } = this.state;

    if (!seasonId) {
      error('[PlayerTotalDistanceGame] seasonId is missing!');
    }
    if (!seasonType) {
      error('[PlayerTotalDistanceGame] seasonType is missing!');
    }
    if (!matchId && !week) {
      error('[PlayerTotalDistanceGame] either week or matchId is missing!');
    }
    if (disableTeamAndPlayerMenu && (!matchId || !teamId || !(playerId || positionId))) {
      // If matchId and/or teamId are not present, then we don't know players of what team of what match to fetch
      // If playerId is not present, then we don't know players of what position to display in PlayerStatsChart menu
      error('[PlayerTotalDistanceGame] Team and Player menus are disabled, but matchId, teamId and/or playerId were not provided!');
    }
    else if (disableTeamMenu && (!matchId || !teamId)) {
      error('[PlayerTotalDistanceGame] Team menu is disabled, but matchId and/or teamId were not provided!');
    }

    return (
      <div className={ c(['container'], 'srt-base-1') }>
        <WidgetHeader title={ t(this, 'nfl_player_total_distance')} className={c(['title']) } />
        {/* Optional menus */}
        <If condition={ !disableTeamAndPlayerMenu }>
          <FetchWeekTeams seasonId={ seasonId } seasonType={ seasonType } week={ week } key={ 'week-teams' }>
            <Menus
              seasonId={ seasonId }
              teamId={ teamId }
              positionId={ positionId }
              playerId={ playerId }
              matchId={ matchId }
              disableTeamMenu={ disableTeamMenu }
              setState={this.setStateBound }
            />
          </FetchWeekTeams>
        </If>
        {/* Stats + chart */}
        <FetchGamePlayersStats matchId={ matchId } teamId={ teamId } key={ 'game-stats' }>
          <TotalDistanceContent
            playerObject={ playerObject }
            type={ 'game' }
            seasonId={ seasonId }
            teamId={ teamId }
            positionId={ positionId }
            playerId={ playerId }
            week={ week }
            setState={ this.setStateBound }
          />
        </FetchGamePlayersStats>
      </div>
    );
  }
}

export default PlayerTotalDistanceGame;
