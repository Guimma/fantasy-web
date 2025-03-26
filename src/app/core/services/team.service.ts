import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface Team {
  id: number;
  name: string;
  description: string;
  leagueId: number;
  ownerId: number;
  players: number[];
  budget: number;
  points: number;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTeamRequest {
  name: string;
  description: string;
  leagueId: number;
}

interface UpdateTeamRequest {
  name?: string;
  description?: string;
  players?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getTeams(leagueId: number): Promise<Team[]> {
    const cacheKey = `teams_${leagueId}`;
    const cachedTeams = this.cacheService.get<Team[]>(cacheKey);
    if (cachedTeams) return Promise.resolve(cachedTeams);

    return this.httpService.get<Team[]>(`/leagues/${leagueId}/teams`)
      .toPromise()
      .then(teams => {
        this.cacheService.set(cacheKey, teams, this.CACHE_TTL);
        return teams;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getTeam(id: number): Promise<Team> {
    const cacheKey = `team_${id}`;
    const cachedTeam = this.cacheService.get<Team>(cacheKey);
    if (cachedTeam) return Promise.resolve(cachedTeam);

    return this.httpService.get<Team>(`/teams/${id}`)
      .toPromise()
      .then(team => {
        this.cacheService.set(cacheKey, team, this.CACHE_TTL);
        return team;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  createTeam(data: CreateTeamRequest): Promise<Team> {
    return this.httpService.post<Team>('/teams', data)
      .toPromise()
      .then(team => {
        this.notificationService.success('Team created successfully');
        this.clearCache();
        return team;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updateTeam(id: number, data: UpdateTeamRequest): Promise<Team> {
    return this.httpService.put<Team>(`/teams/${id}`, data)
      .toPromise()
      .then(team => {
        this.notificationService.success('Team updated successfully');
        this.clearCache();
        return team;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  deleteTeam(id: number): Promise<void> {
    return this.httpService.delete<void>(`/teams/${id}`)
      .toPromise()
      .then(() => {
        this.notificationService.success('Team deleted successfully');
        this.clearCache();
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  addPlayer(teamId: number, playerId: number): Promise<Team> {
    return this.httpService.post<Team>(`/teams/${teamId}/players`, { playerId })
      .toPromise()
      .then(team => {
        this.notificationService.success('Player added successfully');
        this.clearCache();
        return team;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  removePlayer(teamId: number, playerId: number): Promise<Team> {
    return this.httpService.delete<Team>(`/teams/${teamId}/players/${playerId}`)
      .toPromise()
      .then(team => {
        this.notificationService.success('Player removed successfully');
        this.clearCache();
        return team;
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