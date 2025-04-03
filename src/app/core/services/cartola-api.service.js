"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartolaApiService = void 0;
var core_1 = require("@angular/core");
var http_1 = require("@angular/common/http");
var rxjs_1 = require("rxjs");
var CartolaApiService = function () {
    var _classDecorators = [(0, core_1.Injectable)({
            providedIn: 'root'
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CartolaApiService = _classThis = /** @class */ (function () {
        function CartolaApiService_1() {
            this.http = (0, core_1.inject)(http_1.HttpClient);
            this.BASE_URL = 'https://api.cartola.globo.com';
            this.athletesCache = null;
            this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos
        }
        // Obter o status atual do mercado
        CartolaApiService_1.prototype.getMarketStatus = function () {
            console.log('[CartolaAPI] Obtendo status do mercado');
            return this.http.get("".concat(this.BASE_URL, "/mercado/status")).pipe((0, rxjs_1.map)(function (response) {
                console.log('[CartolaAPI] Status do mercado obtido:', response);
                return response;
            }), (0, rxjs_1.catchError)(function (error) {
                console.error('[CartolaAPI] Erro ao obter status do mercado:', error);
                return (0, rxjs_1.of)(null);
            }));
        };
        // Obter a rodada atual
        CartolaApiService_1.prototype.getCurrentRound = function () {
            console.log('[CartolaAPI] Obtendo rodada atual');
            return this.http.get("".concat(this.BASE_URL, "/rodadas")).pipe((0, rxjs_1.map)(function (rounds) {
                console.log('[CartolaAPI] Rodadas obtidas:', rounds);
                if (Array.isArray(rounds)) {
                    // Encontrar a rodada atual baseada na data atual
                    var now_1 = new Date();
                    var currentRound = rounds.find(function (round) {
                        var inicio = new Date(round.inicio);
                        var fim = new Date(round.fim);
                        return now_1 >= inicio && now_1 <= fim;
                    });
                    // Se não encontrar rodada em andamento, retornar a próxima
                    if (!currentRound) {
                        // Ordenar por data de início e encontrar a próxima
                        var sortedRounds = __spreadArray([], rounds, true).sort(function (a, b) {
                            return new Date(a.inicio).getTime() - new Date(b.inicio).getTime();
                        });
                        var nextRound = sortedRounds.find(function (round) {
                            return new Date(round.inicio) > now_1;
                        });
                        var result = nextRound || { rodada_id: 1 };
                        console.log('[CartolaAPI] Próxima rodada identificada:', result);
                        return result;
                    }
                    console.log('[CartolaAPI] Rodada atual identificada:', currentRound);
                    return currentRound;
                }
                console.log('[CartolaAPI] Formato de rodadas não reconhecido, usando rodada 1');
                return { rodada_id: 1 };
            }), (0, rxjs_1.catchError)(function (error) {
                console.error('[CartolaAPI] Erro ao obter rodada atual:', error);
                return (0, rxjs_1.of)({ rodada_id: 1 });
            }));
        };
        // Obter todos os atletas com dados de mercado
        CartolaApiService_1.prototype.getAllAthletes = function () {
            var _this = this;
            // Verificar se temos cache válido
            if (this.athletesCache &&
                (Date.now() - this.athletesCache.timestamp) < this.CACHE_DURATION) {
                console.log('[CartolaAPI] Usando cache de atletas (idade do cache:', Math.round((Date.now() - this.athletesCache.timestamp) / 1000), 'segundos)');
                return (0, rxjs_1.of)(this.athletesCache.data);
            }
            console.log('[CartolaAPI] Obtendo atletas do mercado');
            return this.http.get("".concat(this.BASE_URL, "/atletas/mercado")).pipe((0, rxjs_1.map)(function (response) {
                // Armazenar no cache
                _this.athletesCache = {
                    data: response,
                    timestamp: Date.now()
                };
                if (response && response.atletas) {
                    console.log("[CartolaAPI] ".concat(Object.keys(response.atletas).length, " atletas obtidos da API"));
                    // Depurar o formato dos dados para entender a estrutura
                    if (Object.keys(response.atletas).length > 0) {
                        var sampleAthleteKey = Object.keys(response.atletas)[0];
                        var sampleAthlete = response.atletas[sampleAthleteKey];
                        console.log('[CartolaAPI] Exemplo de estrutura de atleta:', JSON.stringify(sampleAthlete));
                    }
                }
                else {
                    console.log('[CartolaAPI] Retorno vazio ou formato não reconhecido');
                }
                return response;
            }), (0, rxjs_1.catchError)(function (error) {
                console.error('[CartolaAPI] Erro ao obter atletas:', error);
                return (0, rxjs_1.of)(null);
            }), (0, rxjs_1.shareReplay)(1));
        };
        // Obter atletas pontuados em uma rodada específica
        CartolaApiService_1.prototype.getAthletesScores = function (roundId) {
            console.log("[CartolaAPI] Obtendo pontua\u00E7\u00F5es da rodada ".concat(roundId));
            return this.http.get("".concat(this.BASE_URL, "/atletas/pontuados/").concat(roundId)).pipe((0, rxjs_1.map)(function (response) {
                if (response && response.atletas) {
                    console.log("[CartolaAPI] ".concat(Object.keys(response.atletas).length, " atletas pontuados na rodada ").concat(roundId));
                }
                else {
                    console.log("[CartolaAPI] Sem pontua\u00E7\u00F5es ou formato n\u00E3o reconhecido para rodada ".concat(roundId));
                }
                return response;
            }), (0, rxjs_1.catchError)(function (error) {
                console.error("[CartolaAPI] Erro ao obter pontua\u00E7\u00F5es da rodada ".concat(roundId, ":"), error);
                return (0, rxjs_1.of)(null);
            }));
        };
        // Converter dados da API para o formato usado na aplicação
        CartolaApiService_1.prototype.mapAthleteFromApi = function (athlete) {
            // Verificar se o objeto tem a estrutura esperada
            if (!athlete) {
                console.warn('[CartolaAPI] Atleta inválido recebido da API:', athlete);
                return {
                    id: '',
                    idCartola: '',
                    slug: '',
                    nome: 'Desconhecido',
                    apelido: 'Desconhecido',
                    posicao: 'Desconhecido',
                    posicaoAbreviacao: 'DESC',
                    clube: 'Clube Desconhecido',
                    clubeAbreviacao: 'DESC',
                    preco: 0,
                    mediaPontos: 0,
                    jogos: 0,
                    status: 'Desconhecido'
                };
            }
            // Obter o ID numérico do Cartola e gerar o formato ATL_XXX
            var numericId = athlete.atleta_id.toString();
            var atlId = "ATL_".concat(numericId);
            return {
                id: atlId, // ID principal no formato ATL_XXX
                idCartola: numericId, // Guardar o ID numérico original
                slug: atlId, // Slug igual ao ID principal
                slugVariants: [atlId, numericId], // Incluir ambos os formatos
                nome: athlete.nome || '',
                apelido: athlete.apelido || '',
                foto_url: athlete.foto || '',
                posicao: this.mapPositionFromId(athlete.posicao_id),
                posicaoAbreviacao: this.mapPositionAbrevFromId(athlete.posicao_id),
                clube: this.getClubNameById(athlete.clube_id),
                clubeAbreviacao: this.getClubAbbrevById(athlete.clube_id),
                preco: athlete.preco_num || 0,
                mediaPontos: athlete.media_num || 0,
                jogos: athlete.jogos_num || 0,
                status: this.mapStatusFromId(athlete.status_id),
                ultimaAtualizacao: new Date().toISOString(),
                dataCriacao: ''
            };
        };
        // Extrair ID numérico do Cartola a partir do formato ATL_XXX
        CartolaApiService_1.prototype.getNumericIdFromAtlId = function (atlId) {
            if (!atlId)
                return null;
            if (atlId.startsWith('ATL_')) {
                return atlId.substring(4); // Retorna tudo após "ATL_"
            }
            // Se já for um ID numérico, retorna como está
            if (/^\d+$/.test(atlId)) {
                return atlId;
            }
            return null;
        };
        // Mapear ID de posição para nome da posição
        CartolaApiService_1.prototype.mapPositionFromId = function (positionId) {
            var positions = {
                1: 'Goleiro',
                2: 'Lateral',
                3: 'Zagueiro',
                4: 'Meia',
                5: 'Atacante',
                6: 'Técnico'
            };
            return positions[positionId] || 'Desconhecido';
        };
        // Mapear ID de posição para abreviação da posição
        CartolaApiService_1.prototype.mapPositionAbrevFromId = function (positionId) {
            var abrevs = {
                1: 'GOL',
                2: 'LAT',
                3: 'ZAG',
                4: 'MEI',
                5: 'ATA',
                6: 'TEC'
            };
            return abrevs[positionId] || 'DESC';
        };
        // Mapear ID de status para descrição do status
        CartolaApiService_1.prototype.mapStatusFromId = function (statusId) {
            var status = {
                2: 'Dúvida',
                3: 'Suspenso',
                5: 'Contundido',
                6: 'Nulo',
                7: 'Provável'
            };
            return status[statusId] || 'Disponível';
        };
        // Obter nome do clube pelo ID
        CartolaApiService_1.prototype.getClubNameById = function (clubeId) {
            // Esta seria idealmente uma tabela completa de clubes
            // Aqui é apenas um exemplo, o ideal seria carregar isso da API
            var clubes = {
                262: 'Flamengo',
                263: 'Botafogo',
                264: 'Corinthians',
                265: 'Bahia',
                266: 'Fluminense',
                267: 'Vasco',
                275: 'Palmeiras',
                276: 'São Paulo',
                277: 'Santos',
                282: 'Atlético-MG',
                283: 'Cruzeiro',
                284: 'Grêmio',
                285: 'Internacional',
                287: 'Vitória',
                290: 'Athletico-PR',
                292: 'Sport',
                293: 'Cuiabá',
                294: 'Bragantino',
                327: 'Juventude',
                356: 'Fortaleza',
                354: 'Ceará'
            };
            return clubes[clubeId] || 'Clube Desconhecido';
        };
        // Obter abreviação do clube pelo ID
        CartolaApiService_1.prototype.getClubAbbrevById = function (clubeId) {
            // Similar ao anterior, idealmente seria carregado da API
            var abrevs = {
                262: 'FLA',
                263: 'BOT',
                264: 'COR',
                265: 'BAH',
                266: 'FLU',
                267: 'VAS',
                275: 'PAL',
                276: 'SAO',
                277: 'SAN',
                282: 'CAM',
                283: 'CRU',
                284: 'GRE',
                285: 'INT',
                287: 'VIT',
                290: 'CAP',
                292: 'SPT',
                293: 'CUI',
                294: 'RBB',
                327: 'JUV',
                356: 'FOR',
                354: 'CEA'
            };
            return abrevs[clubeId] || 'DESC';
        };
        // Invalidar o cache quando o mercado mudar de status
        CartolaApiService_1.prototype.invalidateCache = function () {
            this.athletesCache = null;
        };
        return CartolaApiService_1;
    }());
    __setFunctionName(_classThis, "CartolaApiService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CartolaApiService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CartolaApiService = _classThis;
}();
exports.CartolaApiService = CartolaApiService;
