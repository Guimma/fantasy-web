import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';

interface Player {
  id: number;
  name: string;
  position: string;
  team: string;
  age: number;
  height: number;
  weight: number;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutes: number;
  };
  value: number;
  status: 'active' | 'injured' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePlayerRequest {
  name: string;
  position: string;
  team: string;
  age: number;
  height: number;
  weight: number;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    minutes: number;
  };
  value: number;
  status: 'active' | 'injured' | 'suspended';
}

interface UpdatePlayerRequest {
  name?: string;
  position?: string;
  team?: string;
  age?: number;
  height?: number;
  weight?: number;
  stats?: {
    points?: number;
    rebounds?: number;
    assists?: number;
    steals?: number;
    blocks?: number;
    turnovers?: number;
    minutes?: number;
  };
  value?: number;
  status?: 'active' | 'injured' | 'suspended';
}

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private httpService: HttpService,
    private cacheService: CacheService,
    private notificationService: NotificationService
  ) {}

  getPlayers(): Promise<Player[]> {
    const cacheKey = 'players';
    const cachedPlayers = this.cacheService.get<Player[]>(cacheKey);
    if (cachedPlayers) return Promise.resolve(cachedPlayers);

    return this.httpService.get<Player[]>('/players')
      .toPromise()
      .then(players => {
        this.cacheService.set(cacheKey, players, this.CACHE_TTL);
        return players;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  getPlayer(id: number): Promise<Player> {
    const cacheKey = `player_${id}`;
    const cachedPlayer = this.cacheService.get<Player>(cacheKey);
    if (cachedPlayer) return Promise.resolve(cachedPlayer);

    return this.httpService.get<Player>(`/players/${id}`)
      .toPromise()
      .then(player => {
        this.cacheService.set(cacheKey, player, this.CACHE_TTL);
        return player;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  createPlayer(data: CreatePlayerRequest): Promise<Player> {
    return this.httpService.post<Player>('/players', data)
      .toPromise()
      .then(player => {
        this.notificationService.success('Player created successfully');
        this.clearCache();
        return player;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updatePlayer(id: number, data: UpdatePlayerRequest): Promise<Player> {
    return this.httpService.put<Player>(`/players/${id}`, data)
      .toPromise()
      .then(player => {
        this.notificationService.success('Player updated successfully');
        this.clearCache();
        return player;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  deletePlayer(id: number): Promise<void> {
    return this.httpService.delete<void>(`/players/${id}`)
      .toPromise()
      .then(() => {
        this.notificationService.success('Player deleted successfully');
        this.clearCache();
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updatePlayerStats(id: number, stats: Player['stats']): Promise<Player> {
    return this.httpService.patch<Player>(`/players/${id}/stats`, stats)
      .toPromise()
      .then(player => {
        this.notificationService.success('Player stats updated successfully');
        this.clearCache();
        return player;
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  updatePlayerStatus(id: number, status: Player['status']): Promise<Player> {
    return this.httpService.patch<Player>(`/players/${id}/status`, { status })
      .toPromise()
      .then(player => {
        this.notificationService.success('Player status updated successfully');
        this.clearCache();
        return player;
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