import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface TeamRanking {
  teamId: number;
  teamName: string;
  leagueId: number;
  points: number;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBehind: number;
  lastTen: string;
  streak: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayerRanking {
  playerId: number;
  playerName: number;
  teamId: number;
  teamName: string;
  leagueId: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutes: number;
  gamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getTeamRankings(leagueId: number): Promise<TeamRanking[]> {
    const cacheKey = `team_rankings_${leagueId}`;
    const cachedRankings = this.cacheService.get<TeamRanking[]>(cacheKey);
    if (cachedRankings) return Promise.resolve(cachedRankings);

    return this.httpService.get<TeamRanking[]>(`/leagues/${leagueId}/rankings/teams`)
      .toPromise()
      .then(rankings => {
        this.cacheService.set(cacheKey, rankings, this.CACHE_TTL);
        return rankings;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getPlayerRankings(leagueId: number): Promise<PlayerRanking[]> {
    const cacheKey = `player_rankings_${leagueId}`;
    const cachedRankings = this.cacheService.get<PlayerRanking[]>(cacheKey);
    if (cachedRankings) return Promise.resolve(cachedRankings);

    return this.httpService.get<PlayerRanking[]>(`/leagues/${leagueId}/rankings/players`)
      .toPromise()
      .then(rankings => {
        this.cacheService.set(cacheKey, rankings, this.CACHE_TTL);
        return rankings;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getTeamRanking(teamId: number): Promise<TeamRanking> {
    const cacheKey = `team_ranking_${teamId}`;
    const cachedRanking = this.cacheService.get<TeamRanking>(cacheKey);
    if (cachedRanking) return Promise.resolve(cachedRanking);

    return this.httpService.get<TeamRanking>(`/teams/${teamId}/ranking`)
      .toPromise()
      .then(ranking => {
        this.cacheService.set(cacheKey, ranking, this.CACHE_TTL);
        return ranking;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getPlayerRanking(playerId: number): Promise<PlayerRanking> {
    const cacheKey = `player_ranking_${playerId}`;
    const cachedRanking = this.cacheService.get<PlayerRanking>(cacheKey);
    if (cachedRanking) return Promise.resolve(cachedRanking);

    return this.httpService.get<PlayerRanking>(`/players/${playerId}/ranking`)
      .toPromise()
      .then(ranking => {
        this.cacheService.set(cacheKey, ranking, this.CACHE_TTL);
        return ranking;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateTeamRankings(leagueId: number): Promise<TeamRanking[]> {
    return this.httpService.post<TeamRanking[]>(`/leagues/${leagueId}/rankings/teams/update`, {})
      .toPromise()
      .then(rankings => {
        this.notificationService.success('Team rankings updated successfully');
        this.clearCache();
        return rankings;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updatePlayerRankings(leagueId: number): Promise<PlayerRanking[]> {
    return this.httpService.post<PlayerRanking[]>(`/leagues/${leagueId}/rankings/players/update`, {})
      .toPromise()
      .then(rankings => {
        this.notificationService.success('Player rankings updated successfully');
        this.clearCache();
        return rankings;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  private clearCache(): void {
    this.cacheService.clear();
  }
} 