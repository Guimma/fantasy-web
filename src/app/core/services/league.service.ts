import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface League {
  id: number;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  rules: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateLeagueRequest {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  entryFee: number;
  rules: string;
}

interface UpdateLeagueRequest {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  entryFee?: number;
  rules?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeagueService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getLeagues(): Promise<League[]> {
    const cacheKey = 'leagues';
    const cachedLeagues = this.cacheService.get<League[]>(cacheKey);
    if (cachedLeagues) return Promise.resolve(cachedLeagues);

    return this.httpService.get<League[]>('/leagues')
      .toPromise()
      .then(leagues => {
        this.cacheService.set(cacheKey, leagues, this.CACHE_TTL);
        return leagues;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getLeague(id: number): Promise<League> {
    const cacheKey = `league_${id}`;
    const cachedLeague = this.cacheService.get<League>(cacheKey);
    if (cachedLeague) return Promise.resolve(cachedLeague);

    return this.httpService.get<League>(`/leagues/${id}`)
      .toPromise()
      .then(league => {
        this.cacheService.set(cacheKey, league, this.CACHE_TTL);
        return league;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  createLeague(data: CreateLeagueRequest): Promise<League> {
    return this.httpService.post<League>('/leagues', data)
      .toPromise()
      .then(league => {
        this.notificationService.success('League created successfully');
        this.clearCache();
        return league;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateLeague(id: number, data: UpdateLeagueRequest): Promise<League> {
    return this.httpService.put<League>(`/leagues/${id}`, data)
      .toPromise()
      .then(league => {
        this.notificationService.success('League updated successfully');
        this.clearCache();
        return league;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  deleteLeague(id: number): Promise<void> {
    return this.httpService.delete<void>(`/leagues/${id}`)
      .toPromise()
      .then(() => {
        this.notificationService.success('League deleted successfully');
        this.clearCache();
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  joinLeague(id: number): Promise<void> {
    return this.httpService.post<void>(`/leagues/${id}/join`, {})
      .toPromise()
      .then(() => {
        this.notificationService.success('Successfully joined the league');
        this.clearCache();
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  leaveLeague(id: number): Promise<void> {
    return this.httpService.post<void>(`/leagues/${id}/leave`, {})
      .toPromise()
      .then(() => {
        this.notificationService.success('Successfully left the league');
        this.clearCache();
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