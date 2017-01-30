var assert = require('assert');
var mysqlToObjParser = require('../index.js');

describe('parse CREATE INDEX', function() {
    it('converts simple create index', function() {
        var sSQL = "CREATE INDEX index_name ON table_name (one_column, two_column);";
        var expectedObj = {
            "table_name": {
                indexes: [{
                    "non_unique": 1,
                    "index_name": "index_name",
                    "index_type": "BTREE",
                    "column_name": "one_column,two_column"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts UNIQUE create index', function() {
        var sSQL = "CREATE UNIQUE INDEX my_index ON my_table ( one_column ,  two_column );";
        var expectedObj = {
            "my_table": {
                indexes: [{
                    "non_unique": 0,
                    "create_type": "UNIQUE",
                    "index_name": "my_index",
                    "index_type": "BTREE",
                    "column_name": "one_column,two_column"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts FULLTEXT create index', function() {
        var sSQL = "CREATE FULLTEXT INDEX my_index_llo ON my_table_2 ( One_column,Two_column );";
        var expectedObj = {
            "my_table_2": {
                indexes: [{
                    "non_unique": 1,
                    "create_type": "FULLTEXT",
                    "index_name": "my_index_llo",
                    "index_type": "BTREE",
                    "column_name": "One_column,Two_column"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts FULLTEXT with USING HASH create index', function() {
        var sSQL = "CREATE FULLTEXT INDEX my_index_llo USING HASH ON my_table_2 ( One_column,Two_column );";
        var expectedObj = {
            "my_table_2": {
                indexes: [{
                    "non_unique": 1,
                    "create_type": "FULLTEXT",
                    "index_name": "my_index_llo",
                    "index_type": "HASH",
                    "column_name": "One_column,Two_column"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts SPATIAL with USING BTREE create index', function() {
        var sSQL = "CREATE SPATIAL INDEX my_index_llo USING BTREE ON my_table_2 ( One_column,Two_column );";
        var expectedObj = {
            "my_table_2": {
                indexes: [{
                    "non_unique": 1,
                    "create_type": "SPATIAL",
                    "index_name": "my_index_llo",
                    "index_type": "BTREE",
                    "column_name": "One_column,Two_column"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts UNIQUE with USING BTREE and some options create index', function() {
        var sSQL = "CREATE UNIQUE INDEX my_index_llo USING BTREE ON my_table_2 ( One_column,Two_column ) KEY_BLOCK_SIZE = 1000;";
        var expectedObj = {
            "my_table_2": {
                indexes: [{
                    "non_unique": 0,
                    "create_type": "UNIQUE",
                    "index_name": "my_index_llo",
                    "index_type": "BTREE",
                    "column_name": "One_column,Two_column",
                    "options": "KEY_BLOCK_SIZE = 1000"
                }]
            }
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
});