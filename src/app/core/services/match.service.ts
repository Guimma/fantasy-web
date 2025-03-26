import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface Match {
  id: number;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score: {
    home: number;
    away: number;
  };
  stats: {
    home: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
    };
    away: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMatchRequest {
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  date: Date;
}

interface UpdateMatchRequest {
  date?: Date;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  score?: {
    home: number;
    away: number;
  };
  stats?: {
    home: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
    };
    away: {
      points: number;
      rebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getMatches(leagueId: number): Promise<Match[]> {
    const cacheKey = `matches_${leagueId}`;
    const cachedMatches = this.cacheService.get<Match[]>(cacheKey);
    if (cachedMatches) return Promise.resolve(cachedMatches);

    return this.httpService.get<Match[]>(`/leagues/${leagueId}/matches`)
      .toPromise()
      .then(matches => {
        this.cacheService.set(cacheKey, matches, this.CACHE_TTL);
        return matches;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getMatch(id: number): Promise<Match> {
    const cacheKey = `match_${id}`;
    const cachedMatch = this.cacheService.get<Match>(cacheKey);
    if (cachedMatch) return Promise.resolve(cachedMatch);

    return this.httpService.get<Match>(`/matches/${id}`)
      .toPromise()
      .then(match => {
        this.cacheService.set(cacheKey, match, this.CACHE_TTL);
        return match;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  createMatch(data: CreateMatchRequest): Promise<Match> {
    return this.httpService.post<Match>('/matches', data)
      .toPromise()
      .then(match => {
        this.notificationService.success('Match created successfully');
        this.clearCache();
        return match;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateMatch(id: number, data: UpdateMatchRequest): Promise<Match> {
    return this.httpService.put<Match>(`/matches/${id}`, data)
      .toPromise()
      .then(match => {
        this.notificationService.success('Match updated successfully');
        this.clearCache();
        return match;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  deleteMatch(id: number): Promise<void> {
    return this.httpService.delete<void>(`/matches/${id}`)
      .toPromise()
      .then(() => {
        this.notificationService.success('Match deleted successfully');
        this.clearCache();
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateMatchScore(id: number, score: Match['score']): Promise<Match> {
    return this.httpService.patch<Match>(`/matches/${id}/score`, score)
      .toPromise()
      .then(match => {
        this.notificationService.success('Match score updated successfully');
        this.clearCache();
        return match;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateMatchStats(id: number, stats: Match['stats']): Promise<Match> {
    return this.httpService.patch<Match>(`/matches/${id}/stats`, stats)
      .toPromise()
      .then(match => {
        this.notificationService.success('Match stats updated successfully');
        this.clearCache();
        return match;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateMatchStatus(id: number, status: Match['status']): Promise<Match> {
    return this.httpService.patch<Match>(`/matches/${id}/status`, { status })
      .toPromise()
      .then(match => {
        this.notificationService.success('Match status updated successfully');
        this.clearCache();
        return match;
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