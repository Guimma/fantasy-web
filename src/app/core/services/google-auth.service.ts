import { Injectable, inject, NgZone, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  id: string;
  accessToken: string;
  role?: string; // admin, manager ou padrão
  dbId?: string;
  originalId?: string; // ID original do Google (pode ser igual ao id em alguns casos)
}

export interface SpreadsheetUser {
  email: string;
  name: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private userSubject = new BehaviorSubject<GoogleUser | null>(null);
  private readonly TOKEN_KEY = 'google_token';
  private readonly USER_KEY = 'google_user';
  private readonly TEAM_KEY = 'user_team';
  private auth2: any = null;
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly USERS_RANGE = 'Usuarios!A:F'; // id_usuario, email, nome, perfil, data_cadastro, ativo
  private readonly TEAMS_RANGE = 'Times!A:I'; // id_time, id_liga, id_usuario, nome, saldo, formacao_atual, pontuacao_total, pontuacao_ultima_rodada, colocacao
  
  private router = inject(Router);
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    // Load the Google API client when the service is created
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleAuth();
    }
    this.loadUser();
  }

  private loadGoogleAuth(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Load the Google API Script
    if (!document.getElementById('google-auth-script')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-auth-script';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }

  private loadUser(): void {
    const user = this.storageService.get<GoogleUser>(this.USER_KEY);
    if (user) {
      this.userSubject.next(user);
    }
  }

  get user$(): Observable<GoogleUser | null> {
    return this.userSubject.asObservable();
  }

  get currentUser(): GoogleUser | null {
    return this.userSubject.value;
  }

  signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check for browser environment
      if (!isPlatformBrowser(this.platformId)) {
        reject('Authentication can only be performed in browser environment');
        return;
      }

      // Initialize the Google Sign-In API
      try {
        // Use the new Google Identity Services API
        if (!(window as any).google) {
          setTimeout(() => this.signIn().then(resolve).catch(reject), 500);
          return;
        }

        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: '657981591726-mc1spr0mmt6bjmgf011pasulclmbjg8o.apps.googleusercontent.com', // Seu ID de cliente OAuth do Google Cloud Console
          scope: 'email profile https://www.googleapis.com/auth/spreadsheets',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              // Get user profile with the access token
              this.getUserProfile(tokenResponse.access_token)
                .then((user) => {
                  // Verificar se o usuário existe na planilha e obter o perfil
                  this.checkUserInSpreadsheet(user)
                    .then(() => {
                      this.zone.run(() => resolve());
                    })
                    .catch(error => {
                      this.zone.run(() => reject(error));
                    });
                })
                .catch(error => {
                  this.zone.run(() => reject(error));
                });
            } else {
              this.zone.run(() => reject('Authentication failed'));
            }
          },
          error_callback: (error: any) => {
            this.zone.run(() => reject(error));
          }
        });

        client.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getUserProfile(accessToken: string): Promise<GoogleUser> {
    return new Promise((resolve, reject) => {
      const headers = { Authorization: `Bearer ${accessToken}` };
      this.http.get('https://www.googleapis.com/oauth2/v3/userinfo', { headers })
        .subscribe({
          next: (userInfo: any) => {
            const googleUser: GoogleUser = {
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              id: userInfo.sub,
              accessToken: accessToken,
              role: 'padrão' // Default role
            };
            
            // Não salvar ainda o usuário aqui, vamos primeiro verificar na planilha
            resolve(googleUser);
          },
          error: (error) => reject(error)
        });
    });
  }

  private ensureSheetHasHeader(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se a planilha já tem cabeçalho
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Usuarios!A1:F1`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      this.http.get(url, { headers }).subscribe({
        next: (response: any) => {
          // Se não houver valores ou a primeira linha não tiver os cabeçalhos esperados
          if (!response.values || response.values.length === 0) {
            // Adicionar cabeçalhos
            this.addHeaderToSheet(accessToken)
              .then(() => resolve())
              .catch(error => reject(error));
          } else {
            // Cabeçalhos já existem
            resolve();
          }
        },
        error: (error) => {
          console.error('Erro ao verificar cabeçalhos:', error);
          // Tentar adicionar cabeçalhos mesmo assim
          this.addHeaderToSheet(accessToken)
            .then(() => resolve())
            .catch(error => reject(error));
        }
      });
    });
  }

  private addHeaderToSheet(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Usuarios!A1:F1?valueInputOption=USER_ENTERED`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const body = {
        values: [
          ['id_usuario', 'email', 'nome', 'perfil', 'data_cadastro', 'ativo'] // Cabeçalhos corretos das colunas
        ]
      };

      this.http.put(url, body, { headers }).subscribe({
        next: () => {
          console.log('Cabeçalhos adicionados com sucesso');
          resolve();
        },
        error: (error) => {
          console.error('Erro ao adicionar cabeçalhos:', error);
          reject(error);
        }
      });
    });
  }

  private checkUserInSpreadsheet(user: GoogleUser): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Verificar se o usuário tem token de acesso
        const accessToken = user.accessToken;
        if (!accessToken) {
          reject('Usuário sem token de acesso');
          return;
        }

        // Salvar o ID original do Google
        user.originalId = user.id;
        console.log('[GoogleAuthService] ID original do Google:', user.originalId);

        // Garantir que a aba Usuarios exista e tenha cabeçalhos
        this.ensureSheetHasHeader(accessToken)
          .then(() => {
            // URL para buscar os usuários na planilha
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.USERS_RANGE}`;
            const headers = { 
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            };
            
            this.http.get<{values: string[][]}>(url, { headers }).subscribe({
              next: (response: any) => {
                console.log('Usuários na planilha:', response);

                // Se não tiver valores ou só tiver cabeçalho
                if (!response.values || response.values.length <= 1) {
                  // Adicionar usuário à planilha
                  this.addUserToSpreadsheet(user)
                    .then(() => {
                      // Verificar se o usuário tem time
                      this.checkUserTeam(user)
                        .then(() => resolve())
                        .catch(error => reject(error));
                    })
                    .catch(error => reject(error));
                  return;
                }
                
                // Procurar o usuário na planilha (ignorando a primeira linha que é o cabeçalho)
                const userRows = response.values.slice(1);
                // Usuário é identificado pelo email que está na coluna 1 (índice 1)
                const userFound = userRows.find((row: string[]) => row[1] === user.email);
                
                if (userFound) {
                  // Usuário encontrado, atualizar o role (perfil está na coluna 3, índice 3)
                  user.role = userFound[3] || 'user';
                  // Salvar o ID do usuário
                  user.dbId = userFound[0];
                  console.log('[GoogleAuthService] ID do usuário na planilha:', user.dbId);
                  
                  this.storageService.set(this.USER_KEY, user);
                  this.storageService.set(this.TOKEN_KEY, user.accessToken);
                  this.userSubject.next(user);
                  console.log('[GoogleAuthService] Usuário existente com perfil:', user.role);
                  
                  // Verificar se o usuário tem time
                  this.checkUserTeam(user)
                    .then(() => resolve())
                    .catch(error => reject(error));
                } else {
                  // Usuário não encontrado, adicionar à planilha
                  this.addUserToSpreadsheet(user)
                    .then(() => {
                      // Verificar se o usuário tem time
                      this.checkUserTeam(user)
                        .then(() => resolve())
                        .catch(error => reject(error));
                    })
                    .catch(error => reject(error));
                }
              },
              error: (error) => {
                console.error('[GoogleAuthService] Erro ao verificar usuário na planilha:', error);
                reject(error);
              }
            });
          })
          .catch(error => {
            console.error('[GoogleAuthService] Erro ao garantir cabeçalhos:', error);
            reject(error);
          });
      } catch (error) {
        console.error('[GoogleAuthService] Erro ao verificar usuário:', error);
        reject(error);
      }
    });
  }

  private generateUserId(existingRows: string[][]): number {
    if (!existingRows || existingRows.length === 0) {
      return 1; // Primeiro usuário
    }
    
    try {
      // Extrair todos os IDs existentes e converter para números
      const ids = existingRows
        .map(row => parseInt(row[0], 10)) // Converter para número usando base 10
        .filter(id => !isNaN(id)); // Remover IDs inválidos
      
      if (ids.length === 0) {
        return 1;
      }
      
      // Encontrar o maior ID e adicionar 1
      const maxId = Math.max(...ids);
      return maxId + 1;
    } catch (error) {
      console.error('Erro ao gerar ID, usando timestamp como fallback:', error);
      // Fallback para timestamp como ID
      return Math.floor(Date.now() / 1000);
    }
  }

  private getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' '); // Formato: YYYY-MM-DD HH:MM:SS
  }

  private addUserToSpreadsheet(user: GoogleUser): Promise<void> {
    return new Promise((resolve, reject) => {
      // Primeiro obter os dados existentes para gerar um ID único
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.USERS_RANGE}`;
      const headers = { 
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json'
      };
      
      this.http.get<{values: string[][]}>(url, { headers }).subscribe({
        next: (response: any) => {
          let existingRows: string[][] = [];
          
          if (response.values && response.values.length > 1) {
            existingRows = response.values.slice(1); // Ignorar o cabeçalho
          }
          
          const userId = this.generateUserId(existingRows);
          const currentDateTime = this.getCurrentDateTime();
          
          // Agora adicionar o usuário com o ID gerado
          const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.USERS_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
          
          const body = {
            values: [
              [
                userId.toString(),    // id_usuario
                user.email,           // email
                user.name,            // nome
                'user',               // perfil (padrão é 'user')
                currentDateTime,      // data_cadastro
                '1'                   // ativo (1 = ativo)
              ]
            ]
          };
          
          this.http.post(appendUrl, body, { headers }).subscribe({
            next: (response: any) => {
              console.log('Usuário adicionado à planilha:', response);
              user.role = 'user'; // Definindo perfil padrão
              user.dbId = userId.toString(); // Salvando o ID do banco de dados
              this.storageService.set(this.USER_KEY, user);
              this.storageService.set(this.TOKEN_KEY, user.accessToken);
              this.userSubject.next(user);
              resolve();
            },
            error: (error) => {
              console.error('Erro ao adicionar usuário à planilha:', error);
              // Mesmo com erro, salvamos o usuário localmente com perfil padrão
              user.role = 'user';
              this.storageService.set(this.USER_KEY, user);
              this.storageService.set(this.TOKEN_KEY, user.accessToken);
              this.userSubject.next(user);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Erro ao obter dados para gerar ID:', error);
          user.role = 'user';
          this.storageService.set(this.USER_KEY, user);
          this.storageService.set(this.TOKEN_KEY, user.accessToken);
          this.userSubject.next(user);
          reject(error);
        }
      });
    });
  }

  // Verificar se o usuário já tem um time
  private checkUserTeam(user: GoogleUser): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!user || !user.accessToken) {
        console.error('[GoogleAuthService] Usuário não autenticado');
        reject('Usuário não autenticado');
        return;
      }

      console.log('[GoogleAuthService] Verificando time para o usuário:', {
        id: user.id,
        originalId: user.originalId,
        dbId: user.dbId,
        email: user.email
      });

      try {
        // Garantir que a aba Times exista e tenha cabeçalhos
        this.ensureTeamsSheetHasHeader(user.accessToken)
          .then(() => {
            // Buscar times do usuário
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`;
            const headers = { 
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            };
            
            this.http.get<{values: string[][]}>(url, { headers }).subscribe({
              next: (response: any) => {
                console.log('[GoogleAuthService] Times na planilha:', response);
                
                if (!response.values || response.values.length <= 1) {
                  // Sem times na planilha ou apenas cabeçalho
                  console.log('[GoogleAuthService] Nenhum time encontrado na planilha');
                  this.storageService.remove(this.TEAM_KEY);
                  resolve();
                  return;
                }
                
                // Procurar o time do usuário (ignorando a primeira linha que é o cabeçalho)
                const teams = response.values.slice(1);
                console.log('[GoogleAuthService] Buscando time para ID do usuário:', user.dbId);
                
                // Tentar encontrar o time de várias maneiras
                let userTeam;
                
                // 1. Tentar pelo dbId (ID do usuário na planilha - forma padrão)
                if (user.dbId) {
                  userTeam = teams.find((row: string[]) => row[2] === user.dbId);
                  if (userTeam) {
                    console.log('[GoogleAuthService] Time encontrado pelo dbId:', user.dbId);
                  }
                }
                
                // 2. Se não encontrou, tentar pelo ID Google
                if (!userTeam && user.id) {
                  userTeam = teams.find((row: string[]) => row[2] === user.id);
                  if (userTeam) {
                    console.log('[GoogleAuthService] Time encontrado pelo id do Google:', user.id);
                  }
                }
                
                // 3. Se não encontrou, tentar pelo originalId
                if (!userTeam && user.originalId) {
                  userTeam = teams.find((row: string[]) => row[2] === user.originalId);
                  if (userTeam) {
                    console.log('[GoogleAuthService] Time encontrado pelo originalId:', user.originalId);
                  }
                }
                
                // 4. Se não encontrou, tentar pelo email
                if (!userTeam && user.email) {
                  userTeam = teams.find((row: string[]) => row[2] === user.email);
                  if (userTeam) {
                    console.log('[GoogleAuthService] Time encontrado pelo email:', user.email);
                  }
                }
                
                if (userTeam) {
                  // Time encontrado, armazenar localmente
                  const team = {
                    id: userTeam[0],          // id_time
                    ligaId: userTeam[1],      // id_liga
                    userId: userTeam[2],      // id_usuario
                    name: userTeam[3],        // nome
                    saldo: Number(userTeam[4] || '0'), // saldo
                    formacao: userTeam[5],    // formacao_atual
                    pontuacaoTotal: Number(userTeam[6] || '0'), // pontuacao_total
                    pontuacaoUltimaRodada: Number(userTeam[7] || '0'), // pontuacao_ultima_rodada
                    colocacao: Number(userTeam[8] || '0') // colocacao
                  };
                  
                  console.log('[GoogleAuthService] Time encontrado e armazenado:', team);
                  this.storageService.set(this.TEAM_KEY, team);
                  resolve();
                } else {
                  // Usuário não tem time
                  console.log('[GoogleAuthService] Nenhum time encontrado para o usuário');
                  this.storageService.remove(this.TEAM_KEY);
                  resolve();
                }
              },
              error: (error) => {
                console.error('[GoogleAuthService] Erro ao verificar times:', error);
                reject(error);
              }
            });
          })
          .catch(error => {
            console.error('[GoogleAuthService] Erro ao garantir cabeçalhos de times:', error);
            reject(error);
          });
      } catch (error) {
        console.error('[GoogleAuthService] Erro ao verificar time do usuário:', error);
        reject(error);
      }
    });
  }

  private ensureTeamsSheetHasHeader(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se a planilha já tem cabeçalho
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Times!A1:I1`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      this.http.get(url, { headers }).subscribe({
        next: (response: any) => {
          // Se não houver valores ou a primeira linha não tiver os cabeçalhos esperados
          if (!response.values || response.values.length === 0) {
            // Adicionar cabeçalhos
            this.addTeamsHeaderToSheet(accessToken)
              .then(() => resolve())
              .catch(error => reject(error));
          } else {
            // Cabeçalhos já existem
            resolve();
          }
        },
        error: (error) => {
          console.error('Erro ao verificar cabeçalhos de times:', error);
          // Tentar adicionar cabeçalhos mesmo assim
          this.addTeamsHeaderToSheet(accessToken)
            .then(() => resolve())
            .catch(error => reject(error));
        }
      });
    });
  }

  private addTeamsHeaderToSheet(accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/Times!A1:I1?valueInputOption=USER_ENTERED`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const body = {
        values: [
          ['id_time', 'id_liga', 'id_usuario', 'nome', 'saldo', 'formacao_atual', 'pontuacao_total', 'pontuacao_ultima_rodada', 'colocacao'] // Cabeçalhos para Times
        ]
      };

      this.http.put(url, body, { headers }).subscribe({
        next: () => {
          console.log('Cabeçalhos de times adicionados com sucesso');
          resolve();
        },
        error: (error) => {
          console.error('Erro ao adicionar cabeçalhos de times:', error);
          reject(error);
        }
      });
    });
  }

  // Criar novo time para o usuário
  createTeam(teamName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const user = this.currentUser;
      if (!user || !user.accessToken || !user.dbId) {
        reject('Usuário não autenticado ou sem ID');
        return;
      }

      // Obter os times existentes para gerar um ID único
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`;
      const headers = { 
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json'
      };
      
      this.http.get<{values: string[][]}>(url, { headers }).subscribe({
        next: (response: any) => {
          let existingTeams: string[][] = [];
          
          if (response.values && response.values.length > 1) {
            existingTeams = response.values.slice(1); // Ignorar o cabeçalho
          }
          
          // Gerar ID para o novo time
          let teamId = 1;
          if (existingTeams.length > 0) {
            const ids = existingTeams
              .map(row => row[0])
              .filter(id => id && !isNaN(Number(id)))
              .map(id => Number(id));
            
            if (ids.length > 0) {
              teamId = Math.max(...ids) + 1;
            }
          }
          
          // Liga inicial (usar 1 como padrão se não existir)
          const ligaId = 1;
          const saldoInicial = 100; // Saldo inicial (pode ser definido por regra da liga)
          const formacaoInicial = 'F001'; // Formação inicial (exemplo)
          
          // Adicionar o time
          const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
          
          const body = {
            values: [
              [
                teamId.toString(),    // id_time
                ligaId.toString(),    // id_liga
                user.dbId,            // id_usuario
                teamName,             // nome
                saldoInicial.toString(), // saldo
                formacaoInicial,      // formacao_atual
                '0',                  // pontuacao_total
                '0',                  // pontuacao_ultima_rodada
                '0'                   // colocacao
              ]
            ]
          };
          
          this.http.post(appendUrl, body, { headers }).subscribe({
            next: (response: any) => {
              console.log('Time criado com sucesso:', response);
              
              // Salvar o time localmente
              const team = {
                id: teamId.toString(),
                ligaId: ligaId.toString(),
                userId: user.dbId,
                name: teamName,
                saldo: saldoInicial,
                formacao: formacaoInicial,
                pontuacaoTotal: 0,
                pontuacaoUltimaRodada: 0,
                colocacao: 0
              };
              
              this.storageService.set(this.TEAM_KEY, team);
              resolve(team);
            },
            error: (error) => {
              console.error('Erro ao criar time:', error);
              reject(error);
            }
          });
        },
        error: (error) => {
          console.error('Erro ao obter times existentes:', error);
          reject(error);
        }
      });
    });
  }

  // Verificar se o usuário tem um time
  hasTeam(): boolean {
    const team = this.storageService.get(this.TEAM_KEY);
    return !!team;
  }

  // Obter o time do usuário
  getUserTeam(): any {
    return this.storageService.get(this.TEAM_KEY);
  }

  public signOut(): void {
    this.storageService.remove(this.TOKEN_KEY);
    this.storageService.remove(this.USER_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Método de diagnóstico para verificar acesso à planilha
  verifySheetAccess(): Observable<boolean> {
    const user = this.currentUser;
    if (!user || !user.accessToken) {
      console.error('Usuário não autenticado');
      return of(false);
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?fields=sheets.properties.title`;
    const headers = { 
      'Authorization': `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get(url, { headers }).pipe(
      map(response => {
        console.log('Acesso à planilha verificado com sucesso:', response);
        return true;
      }),
      catchError(error => {
        console.error('Erro ao acessar planilha:', error);
        // Verificar tipo de erro
        let errorMessage = 'Erro desconhecido ao acessar a planilha';
        
        if (error.status === 403) {
          errorMessage = 'Sem permissão para acessar a planilha. Verifique as permissões do usuário.';
        } else if (error.status === 404) {
          errorMessage = 'Planilha não encontrada. Verifique o ID da planilha.';
        } else if (error.status === 401) {
          errorMessage = 'Token de acesso inválido ou expirado. Faça login novamente.';
        }
        
        console.error(errorMessage);
        return of(false);
      })
    );
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    const user = this.currentUser;
    return !!user && !!user.accessToken;
  }

  hasRole(role: string): boolean {
    const user = this.userSubject.value;
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isManager(): boolean {
    return this.currentUser?.role === 'manager';
  }

  async getAuthClient(): Promise<any> {
    const user = this.currentUser;
    if (!user?.accessToken) {
      throw new Error('User not authenticated');
    }
    return {
      getAccessToken: () => Promise.resolve({ token: user.accessToken })
    };
  }

  validateSheetAccess(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const accessToken = this.storageService.get<string>(this.TOKEN_KEY);
        if (!accessToken) {
          resolve(false);
          return;
        }

        // First, try to get spreadsheet metadata to check access rights
        const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?fields=sheets.properties.title,properties.title`;
        const headers = { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        };
        
        // Try to get metadata first to find the actual sheet name
        this.http.get(metadataUrl, { headers }).subscribe({
          next: (response: any) => {
            console.log('Sheet metadata:', response);
            // If we get here, we have access to the sheet
            resolve(true);
          },
          error: (error) => {
            console.error('Sheet access error:', error);
            if (error.status === 403) {
              // Permission denied
              console.error('You do not have permission to access this sheet');
            } else if (error.status === 404) {
              // Sheet not found
              console.error('Sheet not found');
            } else if (error.status === 401) {
              // Unauthorized - token issue
              console.error('Authentication failed. Token may be invalid.');
              
              // Como estamos usando o interceptor global, não precisamos
              // tratar aqui o refresh do token, o interceptor já fará isso
            }
            resolve(false);
          }
        });
      } catch (error) {
        console.error('Sheet validation error:', error);
        reject(error);
      }
    });
  }

  // Renovar o token quando expirar (401)
  refreshToken(): Observable<string> {
    return new Observable(observer => {
      if (!isPlatformBrowser(this.platformId)) {
        observer.error('Renovação de token só pode ser realizada no navegador');
        return;
      }

      // Se não há usuário logado, não tente renovar o token
      if (!this.currentUser) {
        console.error('GoogleAuthService: Tentativa de renovar token sem usuário autenticado');
        observer.error('Usuário não autenticado');
        return;
      }

      try {
        // Verificar se o SDK do Google está carregado
        if (!(window as any).google) {
          console.log('GoogleAuthService: SDK do Google ainda não carregado, aguardando...');
          // Tentar novamente após um curto delay
          setTimeout(() => {
            console.log('GoogleAuthService: Tentando renovar token novamente...');
            this.refreshToken().subscribe({
              next: token => observer.next(token),
              error: err => observer.error(err),
              complete: () => observer.complete()
            });
          }, 1000);
          return;
        }

        console.log('GoogleAuthService: Iniciando processo de renovação de token...');
        
        try {
          // Usar o método initCodeClient em vez de initTokenClient para evitar problemas de popup
          // Isso requererá interação do usuário, mas dentro do contexto da página atual
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: '657981591726-mc1spr0mmt6bjmgf011pasulclmbjg8o.apps.googleusercontent.com',
            scope: 'email profile https://www.googleapis.com/auth/spreadsheets',
            prompt: 'consent', // Sempre solicitar consentimento para evitar problemas de autenticação silenciosa
            callback: (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                console.log('GoogleAuthService: Token renovado com sucesso');
                
                // Atualizar o token no usuário atual
                const currentUser = this.currentUser;
                if (currentUser) {
                  currentUser.accessToken = tokenResponse.access_token;
                  this.userSubject.next(currentUser);
                  this.storageService.set(this.USER_KEY, currentUser);
                  this.storageService.set(this.TOKEN_KEY, tokenResponse.access_token);
                  
                  console.log('GoogleAuthService: Token atualizado no storage');
                  observer.next(tokenResponse.access_token);
                  observer.complete();
                } else {
                  const error = 'Usuário não encontrado para atualizar token';
                  console.error('GoogleAuthService: ' + error);
                  observer.error(error);
                }
              } else {
                const error = 'Resposta de token inválida';
                console.error('GoogleAuthService: ' + error, tokenResponse);
                observer.error(error);
              }
            },
            error_callback: (error: any) => {
              console.error('GoogleAuthService: Erro no callback do Google OAuth:', error);
              
              // Se o erro for relacionado a popup, informar o usuário
              if (error && error.toString().includes('popup')) {
                console.error('GoogleAuthService: Erro de popup bloqueado');
                observer.error(new Error('POPUP_BLOCKED'));
                return;
              }
              
              // Se o usuário cancelou ou negou acesso, precisamos enviá-lo para fazer login novamente
              if (error && (error.type === 'userCanceled' || error.type === 'accessDenied')) {
                console.log('GoogleAuthService: Usuário cancelou ou negou acesso, redirecionando para login');
                this.signOut();
              }
              
              observer.error(error || 'Erro desconhecido ao renovar token');
            }
          });

          console.log('GoogleAuthService: Solicitando novo token...');
          // Aqui, em vez de chamar requestAccessToken diretamente,
          // verificamos se estamos dentro de uma interação do usuário
          let hasUserInteraction = false;
          try {
            // Uma heurística para verificar se estamos dentro de um evento do usuário
            hasUserInteraction = !!(document.hasFocus() && 
                                  ((window as any).event || 
                                   document.activeElement !== document.body));
          } catch (e) {
            console.warn('GoogleAuthService: Não foi possível verificar interação do usuário', e);
          }

          if (hasUserInteraction) {
            // Estamos em um contexto de evento do usuário, podemos chamar diretamente
            client.requestAccessToken();
          } else {
            // Não estamos em um contexto de evento do usuário, vamos informar
            console.warn('GoogleAuthService: Não foi possível renovar token automaticamente, requer interação do usuário');
            observer.error(new Error('USER_INTERACTION_REQUIRED'));
          }
        } catch (sdkError) {
          console.error('GoogleAuthService: Erro ao inicializar o token client do Google:', sdkError);
          observer.error(sdkError);
        }
      } catch (globalError) {
        console.error('GoogleAuthService: Exceção global ao renovar token:', globalError);
        observer.error(globalError);
      }
    });
  }

  // Verificar se o token atual é válido
  checkTokenValidity(): Observable<boolean> {
    if (!this.currentUser?.accessToken) {
      console.log('GoogleAuthService: Nenhum token disponível');
      return of(false);
    }

    // Fazer uma chamada de teste para verificar a validade do token
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}?fields=properties.title`;
    const headers = { 
      'Authorization': `Bearer ${this.currentUser.accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get(url, { headers }).pipe(
      map(() => {
        console.log('GoogleAuthService: Token validado com sucesso');
        return true;
      }),
      catchError(error => {
        console.error('GoogleAuthService: Erro na validação do token', error);
        
        // Se o erro for 401, o token expirou
        if (error.status === 401) {
          console.log('GoogleAuthService: Token expirado, tentando renovar...');
          
          // Tentar renovar o token
          return this.refreshToken().pipe(
            map(() => {
              console.log('GoogleAuthService: Token renovado e validado');
              return true;
            }),
            catchError(refreshError => {
              console.error('GoogleAuthService: Falha ao renovar token', refreshError);
              
              // Se não conseguir renovar, limpar sessão e redirecionar
              this.signOut();
              return of(false);
            })
          );
        }
        
        // Para outros erros, não renovar o token
        return of(false);
      })
    );
  }
} 