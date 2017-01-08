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
                keywords: ['CREATE', 'TABLE']
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
                sCreateDefinition = _getStringEdgedByBrackets(oMatchRes[4], '(', ')');
                sDefinitions = sDefinitions.substring(0, sCreateDefinition.length + 1);
            }
            var sPartitionOptions = '';
            if (/PARTITION BY/i.test(sDefinitions)) {
                var iPartInd = sDefinitions.indexOf('PARTITION BY');
                if (iPartInd === -1) {
                    iPartInd = sDefinitions.indexOf('partition by');
                }
                sPartitionOptions = sDefinitions.substring(iPartInd);
                sDefinitions = sDefinitions.substring(0, iPartInd);
            }
            var sTableOptions = sDefinitions;
            if (sCreateDefinition) {
                var aColumns = [];
                var aIndexes = [];
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
            
            if (aColumns.length) {
                oCommand.columns = aColumns;
            }
            if (aIndexes.length) {
                oCommand.indexes = aIndexes;
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
                }
            }

            return oCommand;
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
        return sCommand.trim().replace(/\n/img, '').replace(/\s{2,}/img, ' ');
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
                switch (oCommand.name) {
                    case _oConfig.commands.createTable.name:
                        var tempObj = {};
                        if (oCommand.columns) {
                            tempObj.columns = oCommand.columns;
                        }
                        if (oCommand.indexes) {
                            tempObj.indexes = oCommand.indexes;
                        }
                        if (typeof oSQLObj[oCommand.tableName] === 'undefined') {
                            oSQLObj[oCommand.tableName] = tempObj;
                        } else {
                            oSQLObj[oCommand.tableName] = Object.assign(oSQLObj[oCommand.tableName], tempObj);
                        }
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