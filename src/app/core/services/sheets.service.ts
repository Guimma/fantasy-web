import { Injectable } from '@angular/core';
import { GoogleAuthService } from './google-auth.service';
import { google } from 'googleapis';
import { 
  Team, Player, Lineup, Round, Scoring, Transaction, 
  Settings, Draft, DraftConfig, DraftOrder, DraftStatus,
  DraftTeam, DraftPlayerAssignment 
} from '../models/sheets.model';

@Injectable({
  providedIn: 'root'
})
export class SheetsService {
  private sheets: any;
  private spreadsheetId: string = 'YOUR_SPREADSHEET_ID'; // Substitua pelo ID da sua planilha

  constructor(private googleAuthService: GoogleAuthService) {
    this.initializeSheets();
  }

  private async initializeSheets() {
    const auth = await this.googleAuthService.getAuthClient();
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  // Métodos para Times
  async getTeams(): Promise<Team[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Times!A:H'
    });
    return this.mapSheetToTeams(response.data.values);
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const values = this.mapTeamToSheet(team);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Times!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
    return team as Team;
  }

  // Métodos para Jogadores
  async getPlayers(): Promise<Player[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Jogadores!A:I'
    });
    return this.mapSheetToPlayers(response.data.values);
  }

  async updatePlayerStatus(playerId: string, status: Player['status']): Promise<void> {
    const players = await this.getPlayers();
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) throw new Error('Player not found');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Jogadores!E${playerIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] }
    });
  }

  // Métodos para Escalações
  async getLineups(round: number): Promise<Lineup[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Escalacoes!A:H'
    });
    return this.mapSheetToLineups(response.data.values)
      .filter(lineup => lineup.round === round);
  }

  async saveLineup(lineup: Omit<Lineup, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lineup> {
    const values = this.mapLineupToSheet(lineup);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Escalacoes!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
    return lineup as Lineup;
  }

  // Métodos para Rodadas
  async getRounds(): Promise<Round[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Rodadas!A:H'
    });
    return this.mapSheetToRounds(response.data.values);
  }

  async updateRoundStatus(roundId: string, status: Round['status']): Promise<void> {
    const rounds = await this.getRounds();
    const roundIndex = rounds.findIndex(r => r.id === roundId);
    if (roundIndex === -1) throw new Error('Round not found');

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `Rodadas!C${roundIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status]] }
    });
  }

  // Métodos para Pontuações
  async getScorings(roundId: string): Promise<Scoring[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Pontuacoes!A:J'
    });
    return this.mapSheetToScorings(response.data.values)
      .filter(scoring => scoring.roundId === roundId);
  }

  async saveScoring(scoring: Omit<Scoring, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scoring> {
    const values = this.mapScoringToSheet(scoring);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Pontuacoes!A:J',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
    return scoring as Scoring;
  }

  // Métodos para Transações
  async getTransactions(): Promise<Transaction[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Transacoes!A:J'
    });
    return this.mapSheetToTransactions(response.data.values);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const values = this.mapTransactionToSheet(transaction);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: 'Transacoes!A:J',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
    return transaction as Transaction;
  }

  // Métodos para Draft
  async getDraftStatus(): Promise<DraftStatus> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Status!A:I'
    });
    return this.mapSheetToDraftStatus(response.data.values[1]);
  }

  async updateDraftStatus(status: Partial<DraftStatus>): Promise<void> {
    const currentStatus = await this.getDraftStatus();
    const updatedStatus = { ...currentStatus, ...status };
    const values = this.mapDraftStatusToSheet(updatedStatus);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Status!A:I',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
  }

  async getDraftConfig(): Promise<DraftConfig> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Config!A:J'
    });
    return this.mapSheetToDraftConfig(response.data.values[1]);
  }

  async updateDraftConfig(config: Partial<DraftConfig>): Promise<void> {
    const currentConfig = await this.getDraftConfig();
    const updatedConfig = { ...currentConfig, ...config };
    const values = this.mapDraftConfigToSheet(updatedConfig);

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Config!A:J',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });
  }

  async getDraftOrder(): Promise<DraftOrder[]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Order!A:I'
    });
    return this.mapSheetToDraftOrder(response.data.values);
  }

  async saveDraftOrder(orders: Omit<DraftOrder, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const values = orders.map(order => this.mapDraftOrderToSheet(order));
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: 'Draft_Order!A:I',
      valueInputOption: 'RAW',
      requestBody: { values }
    });
  }

  // Métodos de mapeamento
  private mapSheetToTeams(values: any[][]): Team[] {
    return values.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      owner: row[2],
      budget: Number(row[3]),
      points: Number(row[4]),
      position: Number(row[5]),
      createdAt: row[6],
      updatedAt: row[7]
    }));
  }

  private mapTeamToSheet(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): any[] {
    return [
      this.generateId(),
      team.name,
      team.owner,
      team.budget,
      team.points,
      team.position,
      new Date().toISOString(),
      new Date().toISOString()
    ];
  }

  private mapSheetToPlayers(values: any[][]): Player[] {
    return values.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      position: row[2] as Player['position'],
      club: row[3],
      price: Number(row[4]),
      status: row[5] as Player['status'],
      teamId: row[6],
      createdAt: row[7],
      updatedAt: row[8]
    }));
  }

  private mapSheetToLineups(values: any[][]): Lineup[] {
    return values.slice(1).map(row => ({
      id: row[0],
      teamId: row[1],
      round: Number(row[2]),
      formation: row[3],
      players: JSON.parse(row[4]),
      createdAt: row[5],
      updatedAt: row[6]
    }));
  }

  private mapLineupToSheet(lineup: Omit<Lineup, 'id' | 'createdAt' | 'updatedAt'>): any[] {
    return [
      this.generateId(),
      lineup.teamId,
      lineup.round,
      lineup.formation,
      JSON.stringify(lineup.players),
      new Date().toISOString(),
      new Date().toISOString()
    ];
  }

  private mapSheetToRounds(values: any[][]): Round[] {
    return values.slice(1).map(row => ({
      id: row[0],
      number: Number(row[1]),
      status: row[2] as Round['status'],
      startDate: row[3],
      endDate: row[4],
      createdAt: row[5],
      updatedAt: row[6]
    }));
  }

  private mapSheetToScorings(values: any[][]): Scoring[] {
    return values.slice(1).map(row => ({
      id: row[0],
      playerId: row[1],
      roundId: row[2],
      points: Number(row[3]),
      details: JSON.parse(row[4]),
      createdAt: row[5],
      updatedAt: row[6]
    }));
  }

  private mapScoringToSheet(scoring: Omit<Scoring, 'id' | 'createdAt' | 'updatedAt'>): any[] {
    return [
      this.generateId(),
      scoring.playerId,
      scoring.roundId,
      scoring.points,
      JSON.stringify(scoring.details),
      new Date().toISOString(),
      new Date().toISOString()
    ];
  }

  private mapSheetToTransactions(values: any[][]): Transaction[] {
    return values.slice(1).map(row => ({
      id: row[0],
      type: row[1] as Transaction['type'],
      playerId: row[2],
      fromTeamId: row[3],
      toTeamId: row[4],
      price: Number(row[5]),
      roundId: row[6],
      status: row[7] as Transaction['status'],
      createdAt: row[8],
      updatedAt: row[9]
    }));
  }

  private mapTransactionToSheet(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): any[] {
    return [
      this.generateId(),
      transaction.type,
      transaction.playerId,
      transaction.fromTeamId,
      transaction.toTeamId,
      transaction.price,
      transaction.roundId,
      transaction.status,
      new Date().toISOString(),
      new Date().toISOString()
    ];
  }

  private mapSheetToDraftStatus(row: any[]): DraftStatus {
    return {
      id: row[0],
      draftId: row[1],
      status: row[2] as DraftStatus['status'],
      currentTeamId: row[3],
      currentRound: Number(row[4]),
      currentOrderIndex: Number(row[5]),
      createdAt: row[6],
      updatedAt: row[7]
    };
  }

  private mapDraftStatusToSheet(status: DraftStatus): any[] {
    return [
      status.id,
      status.draftId,
      status.status,
      status.currentTeamId,
      status.currentRound,
      status.currentOrderIndex,
      status.createdAt,
      new Date().toISOString()
    ];
  }

  private mapSheetToDraftConfig(row: any[]): DraftConfig {
    return {
      id: row[0],
      draftId: row[1],
      pickTime: Number(row[2]),
      requiredPositions: JSON.parse(row[3]),
      createdAt: row[4],
      updatedAt: row[5]
    };
  }

  private mapDraftConfigToSheet(config: DraftConfig): any[] {
    return [
      config.id,
      config.draftId,
      config.pickTime,
      JSON.stringify(config.requiredPositions),
      config.createdAt,
      new Date().toISOString()
    ];
  }

  private mapSheetToDraftOrder(values: any[][]): DraftOrder[] {
    return values.slice(1).map(row => ({
      id: row[0],
      draftId: row[1],
      teamId: row[2],
      round: Number(row[3]),
      order: Number(row[4]),
      createdAt: row[5],
      updatedAt: row[6]
    }));
  }

  private mapDraftOrderToSheet(order: Omit<DraftOrder, 'id' | 'createdAt' | 'updatedAt'>): any[] {
    return [
      this.generateId(),
      order.draftId,
      order.teamId,
      order.round,
      order.order,
      new Date().toISOString(),
      new Date().toISOString()
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 