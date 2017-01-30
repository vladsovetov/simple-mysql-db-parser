/**
  MIT License

  Copyright (c) 2017 vladsovetov
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

var mysqlToObjParser = (function() {
    var _oConfig = {
        commands_delimiter: ';',
        commands: {
            createTable: {
                name: 'CREATE_TABLE',
                keywords: ['CREATE', 'TABLE'],
                tableOptions: {
                    engine: {
                        regex: /ENGINE\s*(=)?\s*(\w+)/im,
                        valIndex: 2
                    },
                    characterSet: {
                        regex: /(DEFAULT)?\s+CHARACTER SET\s*(=)?\s*(\w+)/im,
                        valIndex: 3
                    }
                }
            },
            createIndex: {
                name: 'CREATE_INDEX',
                keywords: ['CREATE', 'INDEX']
            },
            createFunction: {
                name: 'CREATE_FUNCTION',
                keywords: ['CREATE', 'FUNCTION'],
                characteristic: {
                    regex: /(LANGUAGE\s+SQL|DETERMINISTIC|NOT\s+DETERMINISTIC|CONTAINS\s+SQL|NO\s+SQL|READS\s+SQL\s+DATA|MODIFIES\s+SQL\s+DATA|SQL\s+SECURITY\s+DEFINER|SQL\s+SECURITY\s+INVOKER)/im,
                    valIndex: 1
                }
            }
        }
    }

    var _parseCreateTableCommand = function(sSQLCommand) {
        var oCommand = {
            name: _oConfig.commands.createTable.name
        };

        var regex = /CREATE(\s+TEMPORARY)?\s+TABLE(\s+IF NOT EXISTS)?\s+(\w+)(.*)?/im;
        var oMatchRes = sSQLCommand.match(regex);
        if (oMatchRes[3]) {
            oCommand.tableName = oMatchRes[3];
        }
        if (oMatchRes[4]) {
            var sDefinitions = oMatchRes[4];
            var sCreateDefinition = '';
            if (sDefinitions.indexOf('(') !== -1) {
                sCreateDefinition = _getStringEdgedByBrackets(sDefinitions, '(', ')');
                sDefinitions = sDefinitions.substring(sCreateDefinition.length + 1);
            }
            var aColumns = [];
            var aIndexes = [];
            if (sCreateDefinition) {
                var aCreateDef = _getSplittedStringWithoutBreakingBrackets(sCreateDefinition, ',', '(', ')'),
                    sCreateDef = '';

                for (var ind = 0; ind < aCreateDef.length; ind++) {
                    sCreateDef = aCreateDef[ind];
                    oColumn = {};

                    if (/PRIMARY KEY/i.test(sCreateDef)) {
                        var primKeyRegex = /(CONSTRAINT\s+)?([^\s]+\s+)?PRIMARY KEY(\s+USING\s+(BTREE|HASH))?\s*\(([^\)]+)\)/im;
                        var oMatch = sCreateDef.match(primKeyRegex);
                        var sKeyName = typeof oMatch[1] !== 'undefined' && typeof oMatch[2] !== 'undefined' ? oMatch[2].trim() : 'PRIMARY';
                        var sIndexType = typeof oMatch[3] !== 'undefined' && typeof oMatch[4] !== 'undefined' ? oMatch[4].trim() : 'BTREE';
                        aIndexes.push({
                            "non_unique": 0,
                            "key_name": sKeyName,
                            "key_type": "PRIMARY",
                            "index_type": sIndexType,
                            "column_name": typeof oMatch[5] !== 'undefined' ? oMatch[5].trim() : ''
                        });
                    } else if (/FOREIGN KEY/i.test(sCreateDef)) {
                        var primKeyRegex = /(CONSTRAINT\s+)?([^\s]+\s+)?FOREIGN KEY\s*\(([^\)]+)\)\s+REFERENCES\s+([^\s]+)\s+\(([^\)]+)\)(.*)?/im;
                        var oMatch = sCreateDef.match(primKeyRegex);
                        // for primary key keyname is always PRIMARY even if we will specify name for this CONSTRAINT
                        var sColumnName = typeof oMatch[3] !== 'undefined' ? oMatch[3].trim() : '';
                        var sKeyName = typeof oMatch[1] !== 'undefined' && typeof oMatch[2] !== 'undefined' ? oMatch[2].trim() : sColumnName;
                        var oReferences = {
                            "tableName": typeof oMatch[4] !== 'undefined' ? oMatch[4].trim() : '',
                            "columns":  typeof oMatch[5] !== 'undefined' ? oMatch[5].trim() : '',
                        }
                        if (typeof oMatch[6] !== 'undefined') {
                            var refReg = /ON DELETE\s+(RESTRICT|CASCADE|SET NULL|NO ACTION)/im;
                            var refMatch = oMatch[6].match(refReg);
                            if (refMatch && refMatch[1]) {
                                oReferences["onDelete"] = refMatch[1].trim();
                            }
                            var refReg = /ON UPDATE\s+(RESTRICT|CASCADE|SET NULL|NO ACTION)/im;
                            var refMatch = oMatch[6].match(refReg);
                            if (refMatch && refMatch[1]) {
                                oReferences["onUpdate"] = refMatch[1].trim();
                            }
                        }
                        aIndexes.push({
                            "non_unique": 1,
                            "key_name": sKeyName,
                            "key_type": "FOREIGN",
                            "column_name": sColumnName,
                            "references": oReferences
                        });
                    } else if (/UNIQUE/i.test(sCreateDef)) {

                    } else if (/FULLTEXT/i.test(sCreateDef) || /SPATIAL/i.test(sCreateDef)) {

                    } else if (/INDEX/i.test(sCreateDef) || /KEY/i.test(sCreateDef)) {

                    } else {
                        var colRegex = /([^\s]+)\s+([^\s]+)(\s+(NOT NULL|NULL))?(\s+DEFAULT\s+([^\s]+))?/im;
                        var oMatch = sCreateDef.match(colRegex);
                        var sDefault = typeof oMatch[6] !== 'undefined' ? oMatch[6] : '';
                        if (sDefault[0] === '\'' && sDefault[sDefault.length - 1] === '\'') {
                            sDefault = sDefault.substring(1, sDefault.length - 1);
                        }
                        aColumns.push({
                            "field": oMatch[1],
                            "type": oMatch[2],
                            "null": typeof oMatch[4] !== 'undefined' && (oMatch[4] === 'NULL' || oMatch[4] === 'null') ||
                                    typeof oMatch[6] !== 'undefined' && (oMatch[6] === 'NULL' || oMatch[6] === 'null'),
                            "default": sDefault
                        });
                    }
                }
            }

            if (sDefinitions) {
                var oTableOptions = {};
                var aOptions = _oConfig.commands.createTable.tableOptions;
                for (var sOptName in aOptions) {
                    if (!aOptions.hasOwnProperty(sOptName)) {
                        continue;
                    }

                    var oMatchOpt = sDefinitions.match(aOptions[sOptName].regex);
                    if (oMatchOpt && typeof oMatchOpt[aOptions[sOptName].valIndex] !== 'undefined') {
                        oTableOptions[sOptName] = oMatchOpt[aOptions[sOptName].valIndex];
                    }
                }
            }
            
            if (aColumns.length) {
                oCommand.columns = aColumns;
            }
            if (aIndexes.length) {
                oCommand.indexes = aIndexes;
            }
            if (Object.keys(oTableOptions).length) {
                oCommand.tableOptions = oTableOptions;
            }
        }

        return oCommand;
    };

    var _parseCreateIndexCommand = function(sSQLCommand) {
        var oCommand = {
            name: _oConfig.commands.createIndex.name
        };

        var regex = /CREATE(\s+(UNIQUE|FULLTEXT|SPATIAL))?\s+INDEX\s+(\w+)(\s+USING\s+(BTREE|HASH))?\s+ON\s+(\w+)(.*)/im;
        var oMatchRes = sSQLCommand.match(regex);
        if (oMatchRes[2]) {
            oCommand.createType = oMatchRes[2];
        }
        if (oMatchRes[3]) {
            oCommand.indexName = oMatchRes[3];
        }
        if (oMatchRes[5]) {
            oCommand.indexType = oMatchRes[5];
        } else {
            oCommand.indexType = 'BTREE';
        }
        if (oMatchRes[6]) {
            oCommand.tableName = oMatchRes[6];
        }
        if (oMatchRes[7]) {
            var sDef = oMatchRes[7].trim();
            var sColumns = _getStringEdgedByBrackets(sDef, '(', ')');
            var sOptions = sDef.substring(sColumns.length + 2);
            sColumns = sColumns.replace(/\s/img, '');
            sOptions = sOptions.trim();

            if (sColumns) {
                oCommand.columnName = sColumns;
            }
            if (sOptions) {
                oCommand.options = sOptions;
            }
        }

        return oCommand;
    };

    var _parseCreateFunctionCommand = function(sSQLCommand) {
        var oCommand = {
            name: _oConfig.commands.createFunction.name,
            body: {}
        };

        var regex = /CREATE(\s+DEFINER\s*=\s*(CURRENT_USER|\w+))?\s+FUNCTION\s+(\w+)\s+\(([^)]+)\)\s+RETURNS\s+([^\s]+)(.*)/im;
        var oMatchRes = sSQLCommand.match(regex);
        if (oMatchRes[2]) {
            oCommand.body.definer = oMatchRes[2];
        }
        if (oMatchRes[3]) {
            oCommand.body.name = oMatchRes[3];
        }
        if (oMatchRes[4]) {
            oCommand.body.parameters = oMatchRes[4].split(/\s*,\s*/g);
        }
        if (oMatchRes[5]) {
            oCommand.body.returnType = oMatchRes[5];
        }
        if (oMatchRes[6]) {
            var sDef = oMatchRes[6].trim();
            var charactRegex = _oConfig.commands.createFunction.characteristic.regex;
            var oMatch = sDef.match(charactRegex);
            if (oMatch[1]) {
                oCommand.body.characteristic = oMatch[1];
                sDef = sDef.substring(oMatch[1].length);
            }

            if (sDef) {
                oCommand.body.routineBody = sDef.trim();
            }
        }

        return oCommand;
    };

    var _parseCommand = function(sSQLCommand) {
        var oCommand = null;
        for (var sCommandName in _oConfig.commands) {
            if (!_oConfig.commands.hasOwnProperty(sCommandName)) {
                continue;
            }

            var bMatched = true;
            for (var ind = 0; ind < _oConfig.commands[sCommandName].keywords.length; ind++) {
                if (sSQLCommand.indexOf(_oConfig.commands[sCommandName].keywords[ind]) === -1) {
                    bMatched = false;
                    break;
                }
            }

            if (bMatched) {
                switch (sCommandName) {
                    case 'createTable':
                        oCommand = _parseCreateTableCommand(sSQLCommand);
                        break;
                    case 'createIndex':
                        oCommand = _parseCreateIndexCommand(sSQLCommand);
                        break;
                    case 'createFunction':
                        oCommand = _parseCreateFunctionCommand(sSQLCommand);
                        break;
                }
            }
        }

        return oCommand;
    };

    var _getStringEdgedByBrackets = function(string, sStartBracket, sCloseBracket) {
        var iOpenBracketCounter = 0,
            sResult = '',
            iStartInd = 0;
        for (var ind = 0; ind < string.length; ind++) {
            if (string[ind] === sStartBracket) {
                iOpenBracketCounter++;
                if (iOpenBracketCounter === 1) {
                    iStartInd = ind;
                }
            } else if (string[ind] === sCloseBracket) {
                if (iOpenBracketCounter > 1) {
                    iOpenBracketCounter--;
                } else {
                    sResult = string.substring(iStartInd + 1, ind);
                    break;
                }
            }
        }

        return sResult;
    };

    var _getSplittedStringWithoutBreakingBrackets = function(string, sSplitter, sStartBracket, sCloseBracket) {
        var iOpenBracketCounter = 0,
            aResult = [],
            iPrevInd = 0;
        for (var ind = 0; ind < string.length; ind++) {
            if (string[ind] === sStartBracket) {
                iOpenBracketCounter++;
            } else if (string[ind] === sCloseBracket) {
                iOpenBracketCounter--;
            } else if (string[ind] === sSplitter) {
                if (iOpenBracketCounter === 0) {
                    aResult.push(string.substring(iPrevInd, ind).trim());
                    iPrevInd = ind + 1;
                }
            }
        }

        if (!aResult.length) {
            aResult.push(string);
        } else if (iPrevInd < string.length) {
            aResult.push(string.substring(iPrevInd).trim());
        }

        return aResult;
    };

    var _getFormattedCommand = function(sCommand) {
        return sCommand.trim().replace(/\n/img, ' ').replace(/\s{2,}/img, ' ');
    };

    var parse = function(sSQL) {
        var oSQLObj = {};
        var aSQLCommands = sSQL.split(_oConfig.commands_delimiter);
        var sSQLCommand = '',
            oCommand = {};
        for (var ind = 0; ind < aSQLCommands.length; ind++) {
            sSQLCommand = aSQLCommands[ind].trim();
            if (sSQLCommand) {
                oCommand = _parseCommand(_getFormattedCommand(sSQLCommand));
                if (!oCommand) {
                    continue;
                }
                switch (oCommand.name) {
                    case _oConfig.commands.createTable.name:
                        var tempObj = {};
                        if (oCommand.columns) {
                            tempObj.columns = oCommand.columns;
                        }
                        if (oCommand.indexes) {
                            tempObj.indexes = oCommand.indexes;
                        }
                        if (oCommand.tableOptions) {
                            tempObj.tableOptions = oCommand.tableOptions;
                        }
                        if (typeof oSQLObj[oCommand.tableName] === 'undefined') {
                            oSQLObj[oCommand.tableName] = tempObj;
                        } else {
                            oSQLObj[oCommand.tableName] = Object.assign(oSQLObj[oCommand.tableName], tempObj);
                        }
                        break;
                    case _oConfig.commands.createIndex.name:
                        var tempObj = {};
                        if (oCommand.createType) {
                            tempObj.create_type = oCommand.createType;
                            tempObj.non_unique = tempObj.create_type === 'UNIQUE' ? 0 : 1;
                        } else {
                            tempObj.non_unique = 1;
                        }
                        if (oCommand.indexName) {
                            tempObj.index_name = oCommand.indexName;
                        }
                        if (oCommand.indexType) {
                            tempObj.index_type = oCommand.indexType;
                        }
                        if (oCommand.columnName) {
                            tempObj.column_name = oCommand.columnName;
                        }
                        if (oCommand.options) {
                            tempObj.options = oCommand.options;
                        }
                        if (typeof oSQLObj[oCommand.tableName] === 'undefined') {
                            oSQLObj[oCommand.tableName] = {
                                indexes: []
                            };
                        }
                        if (typeof oSQLObj[oCommand.tableName].indexes === 'undefined') {
                            oSQLObj[oCommand.tableName].indexes = [];
                        }
                        oSQLObj[oCommand.tableName].indexes.push(tempObj);
                        break;
                    case _oConfig.commands.createFunction.name:
                        if (typeof oSQLObj.functions === 'undefined') {
                            oSQLObj.functions = [];
                        }
                        oSQLObj.functions.push(oCommand.body);
                        break;
                }
            }
        }
        return oSQLObj;
    };

    return {
        parse: parse
    }
})();

module.exports = mysqlToObjParser;