import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface PlayerStats {
  playerId: number;
  matchId: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamStats {
  teamId: number;
  matchId: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoals: {
    made: number;
    attempted: number;
    percentage: number;
  };
  threePointers: {
    made: number;
    attempted: number;
    percentage: number;
  };
  freeThrows: {
    made: number;
    attempted: number;
    percentage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface LeagueStats {
  leagueId: number;
  totalMatches: number;
  totalTeams: number;
  totalPlayers: number;
  averagePointsPerGame: number;
  averageReboundsPerGame: number;
  averageAssistsPerGame: number;
  averageStealsPerGame: number;
  averageBlocksPerGame: number;
  averageTurnoversPerGame: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getPlayerStats(playerId: number): Promise<PlayerStats[]> {
    const cacheKey = `player_stats_${playerId}`;
    const cachedStats = this.cacheService.get<PlayerStats[]>(cacheKey);
    if (cachedStats) return Promise.resolve(cachedStats);

    return this.httpService.get<PlayerStats[]>(`/players/${playerId}/stats`)
      .toPromise()
      .then(stats => {
        this.cacheService.set(cacheKey, stats, this.CACHE_TTL);
        return stats;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getTeamStats(teamId: number): Promise<TeamStats[]> {
    const cacheKey = `team_stats_${teamId}`;
    const cachedStats = this.cacheService.get<TeamStats[]>(cacheKey);
    if (cachedStats) return Promise.resolve(cachedStats);

    return this.httpService.get<TeamStats[]>(`/teams/${teamId}/stats`)
      .toPromise()
      .then(stats => {
        this.cacheService.set(cacheKey, stats, this.CACHE_TTL);
        return stats;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getLeagueStats(leagueId: number): Promise<LeagueStats> {
    const cacheKey = `league_stats_${leagueId}`;
    const cachedStats = this.cacheService.get<LeagueStats>(cacheKey);
    if (cachedStats) return Promise.resolve(cachedStats);

    return this.httpService.get<LeagueStats>(`/leagues/${leagueId}/stats`)
      .toPromise()
      .then(stats => {
        this.cacheService.set(cacheKey, stats, this.CACHE_TTL);
        return stats;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updatePlayerStats(playerId: number, matchId: number, stats: Omit<PlayerStats, 'playerId' | 'matchId' | 'createdAt' | 'updatedAt'>): Promise<PlayerStats> {
    return this.httpService.post<PlayerStats>(`/players/${playerId}/matches/${matchId}/stats`, stats)
      .toPromise()
      .then(updatedStats => {
        this.notificationService.success('Player stats updated successfully');
        this.clearCache();
        return updatedStats;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateTeamStats(teamId: number, matchId: number, stats: Omit<TeamStats, 'teamId' | 'matchId' | 'createdAt' | 'updatedAt'>): Promise<TeamStats> {
    return this.httpService.post<TeamStats>(`/teams/${teamId}/matches/${matchId}/stats`, stats)
      .toPromise()
      .then(updatedStats => {
        this.notificationService.success('Team stats updated successfully');
        this.clearCache();
        return updatedStats;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  calculatePlayerAverages(playerId: number): Promise<Omit<PlayerStats, 'playerId' | 'matchId' | 'createdAt' | 'updatedAt'>> {
    return this.httpService.get<Omit<PlayerStats, 'playerId' | 'matchId' | 'createdAt' | 'updatedAt'>>(`/players/${playerId}/stats/averages`)
      .toPromise()
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  calculateTeamAverages(teamId: number): Promise<Omit<TeamStats, 'teamId' | 'matchId' | 'createdAt' | 'updatedAt'>> {
    return this.httpService.get<Omit<TeamStats, 'teamId' | 'matchId' | 'createdAt' | 'updatedAt'>>(`/teams/${teamId}/stats/averages`)
      .toPromise()
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  private clearCache(): void {
    this.cacheService.clear();
  }
} 