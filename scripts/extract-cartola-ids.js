"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// List of athlete IDs from the Google Sheet
var athleteIds = [
    'ATL_0JVKBX', 'ATL_0NOGJD', 'ATL_0Z36F8', 'ATL_15NHUQ', 'ATL_20A8EB',
    'ATL_2GY17E', 'ATL_2WF9OJ', 'ATL_2YWR68', 'ATL_3361ZK', 'ATL_3O9S6C',
    'ATL_3S651J', 'ATL_3TLJ58', 'ATL_3VLR8M', 'ATL_3YDZ91', 'ATL_40JSYN',
    'ATL_4ASEQE', 'ATL_4COHIX', 'ATL_4E826J', 'ATL_4ERKEX', 'ATL_4HF3J8',
    'ATL_4PHA8A', 'ATL_4VT06E', 'ATL_4W6ALC', 'ATL_5245II', 'ATL_58Y1WF',
    'ATL_5DRBZH', 'ATL_5EUYBT', 'ATL_5Z2G3I', 'ATL_60B7QN', 'ATL_621D62',
    'ATL_69NQSW', 'ATL_6EB0QD', 'ATL_6KPUZ8', 'ATL_6M6XLU', 'ATL_71B9ZX',
    'ATL_75JPIU', 'ATL_7BRLYN', 'ATL_7DZXD4', 'ATL_7U7WB3', 'ATL_86JQ8B',
    'ATL_86NVQP', 'ATL_87C704', 'ATL_8CQ3L4', 'ATL_8L64T1', 'ATL_8P3PKP',
    'ATL_8P3YI9', 'ATL_8Y561S', 'ATL_95SI6S', 'ATL_95VQ4R', 'ATL_9KETFD',
    'ATL_9KNHH3', 'ATL_9OXWUK', 'ATL_9XLLFN', 'ATL_A0B1IT', 'ATL_A2IOWF',
    'ATL_A5ZI22', 'ATL_AB0WUJ', 'ATL_AEOLWH', 'ATL_AJ5O9F', 'ATL_AMEDVS',
    'ATL_ATF9LA', 'ATL_AVICXP', 'ATL_B3IPW1', 'ATL_BCELTA', 'ATL_BYWCN2',
    'ATL_C0BGDX', 'ATL_C716Z7', 'ATL_C7F22E', 'ATL_DCPDKY', 'ATL_DCVE4B',
    'ATL_DDGD2J', 'ATL_DFJQ09', 'ATL_E1ZU25', 'ATL_EE0T05', 'ATL_ELUJ5V',
    'ATL_EN0N32', 'ATL_ENFNJE', 'ATL_F32D58', 'ATL_F5NGY7', 'ATL_FTZB79',
    'ATL_FVB0Y0', 'ATL_FW47WZ', 'ATL_G07UK1', 'ATL_G64GTT', 'ATL_G7MVFS',
    'ATL_G7OCIP', 'ATL_GBHE2Q', 'ATL_GHA3W5', 'ATL_GQDYVV', 'ATL_GWBPZF',
    'ATL_H25BS4', 'ATL_HD44TB', 'ATL_HDC15K', 'ATL_HNK04M', 'ATL_HZZPMC',
    'ATL_I2RBXO', 'ATL_I7E0L6', 'ATL_I7T4PX', 'ATL_IA945Z', 'ATL_IIYH50',
    'ATL_IPXED6', 'ATL_J13OZ4', 'ATL_J4IJIW', 'ATL_J4MMAT', 'ATL_J5R2YR',
    'ATL_J7118H', 'ATL_JB5CTL', 'ATL_JJB86Z', 'ATL_JN4SI1', 'ATL_JTFBVC',
    'ATL_JXP1SA', 'ATL_JZW5BX', 'ATL_KGMXGA', 'ATL_KK0YRU', 'ATL_KOB7BY',
    'ATL_KXR4PA', 'ATL_L0W18E', 'ATL_LH3QU7', 'ATL_LLIKXR', 'ATL_LS3K9N',
    'ATL_LS4G0W', 'ATL_LSRCKH', 'ATL_LWS2K7', 'ATL_LYDMZC', 'ATL_M6DKPO',
    'ATL_MIOXJL', 'ATL_N2HTDL', 'ATL_N6KSEX', 'ATL_NCJFRB', 'ATL_NDREZS',
    'ATL_NGX28A', 'ATL_NQU8VS', 'ATL_NVA3NN', 'ATL_NWIZV1', 'ATL_O366BQ',
    'ATL_O7WFX9', 'ATL_O9ODEC', 'ATL_OMS2CK', 'ATL_OSBVHJ', 'ATL_OSQGTG',
    'ATL_P2PGRX', 'ATL_P6I63U', 'ATL_PNN0LG', 'ATL_PPP13J', 'ATL_PQZIA7',
    'ATL_PSSG0V', 'ATL_PYXD2F', 'ATL_Q9F0MQ', 'ATL_Q9RESC', 'ATL_QA0OME',
    'ATL_QIFKM9', 'ATL_R08BHF', 'ATL_R0QLPX', 'ATL_R5BBAK', 'ATL_R7Z8S1',
    'ATL_RIXKTE', 'ATL_S4VLZI', 'ATL_SGFG64', 'ATL_SMIFN8', 'ATL_SSP112',
    'ATL_SUN6W3', 'ATL_SWK3N5', 'ATL_T0JXMW', 'ATL_T6LPH6', 'ATL_T7T3QU',
    'ATL_TGLVTX', 'ATL_TNWACV', 'ATL_TTCTVD', 'ATL_U52WPU', 'ATL_U78GHT',
    'ATL_UCQ5ST', 'ATL_UCZ802', 'ATL_UEWBF8', 'ATL_UHP2NQ', 'ATL_US67WD',
    'ATL_VF8DBA', 'ATL_VP07DW', 'ATL_W0NZBM', 'ATL_W11T7P', 'ATL_W382NP',
    'ATL_WCMVZF', 'ATL_WDY5RE', 'ATL_WMN71H', 'ATL_WO9IHI', 'ATL_WPEOE8',
    'ATL_WV6MJX', 'ATL_XA3CR1', 'ATL_XI5QRX', 'ATL_XLMQIK', 'ATL_XM7W1C',
    'ATL_XVDC7Z', 'ATL_Y1WQ3I', 'ATL_Y4XW8Q', 'ATL_YBJ20Y', 'ATL_YE1PHL',
    'ATL_YK3WOJ', 'ATL_YRK7EM', 'ATL_ZMZTQO'
];
// Custom function to extract numericId without using the service
function getNumericIdFromAtlId(atlId) {
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
}
// Main function to extract Cartola IDs
function extractCartolaIds() {
    console.log('Extracting Cartola IDs for athletes...');
    // Extract numeric IDs
    var result = athleteIds.map(function (id) {
        var numericId = getNumericIdFromAtlId(id);
        return {
            atleta_id: id,
            id_cartola: numericId
        };
    });
    // Output as JSON string for easy copy-paste to Google Sheets
    console.log('Results:');
    console.log(JSON.stringify(result));
    // Output in CSV format (easier to paste into Google Sheets)
    console.log('\nCSV Format (copy and paste into Google Sheets):');
    console.log('atleta_id,id_cartola');
    for (var _i = 0, result_1 = result; _i < result_1.length; _i++) {
        var athlete = result_1[_i];
        console.log("".concat(athlete.atleta_id, ",").concat(athlete.id_cartola));
    }
}
// Run the extraction function
extractCartolaIds();
