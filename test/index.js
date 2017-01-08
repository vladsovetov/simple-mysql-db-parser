var assert = require('assert');
var mysqlToObjParser = require('../index.js');

describe('parse CREATE TABLE', function() {
    it('converts simple creation', function() {
        var sSQL = "CREATE TABLE new_tbl;";
        var expectedObj = {
            "new_tbl": {}
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts simple creation if not exists', function() {
        var sSQL = "CREATE TABLE IF NOT EXISTS new_tbl;";
        var expectedObj = {
            "new_tbl": {}
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts simple creation temporary and if not exists', function() {
        var sSQL = "CREATE TEMPORARY TABLE IF NOT EXISTS new_tbl;";
        var expectedObj = {
            "new_tbl": {}
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creating with one field', function() {
        var sSQL = "CREATE TABLE new_tbl (id int NOT NULL);";
        var expectedObj = {
            "new_tbl": {
                columns: [{
                    "field": "id",
                    "type": "int",
                    "null": false,
                    "default": ""
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with one field null field', function() {
        var sSQL = "CREATE TABLE new_tbl (id int NULL);";
        var expectedObj = {
            "new_tbl": {
                columns: [{
                    "field": "id",
                    "type": "int",
                    "null": true,
                    "default": ""
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with one field as null field', function() {
        var sSQL = "CREATE TABLE new_tbl (id bigint(20) DEFAULT NULL);";
        var expectedObj = {
            "new_tbl": {
                columns: [{
                    "field": "id",
                    "type": "bigint(20)",
                    "null": true,
                    "default": "NULL"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with many fields', function() {
        var sSQL = `CREATE TABLE complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      some_counter int(10) DEFAULT 0,
                      status enum('disabled','enabled','updated','deleted') DEFAULT 'disabled',
                      double_counter DOUBLE(10,3),
                      creation_date bigint(20) DEFAULT NULL);`;
        var expectedObj = {
            "complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                },{
                    "field": "some_counter",
                    "type": "int(10)",
                    "null": false,
                    "default": "0"
                },{
                    "field": "status",
                    "type": "enum('disabled','enabled','updated','deleted')",
                    "null": false,
                    "default": "disabled"
                },{
                    "field": "double_counter",
                    "type": "DOUBLE(10,3)",
                    "null": false,
                    "default": ""
                },{
                    "field": "creation_date",
                    "type": "bigint(20)",
                    "null": true,
                    "default": "NULL"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with primary key', function() {
        var sSQL = `CREATE TABLE complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (user_id));`;
        var expectedObj = {
            "complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "user_id",
                    "index_type": "BTREE"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint primary key', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      CONSTRAINT pk_some_strange_name PRIMARY KEY (id));`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "pk_some_strange_name",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint primary key and some column names', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      CONSTRAINT pk_some_strange_name PRIMARY KEY (id, user_id));`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "pk_some_strange_name",
                    "key_type": "PRIMARY",
                    "column_name": "id, user_id",
                    "index_type": "BTREE"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint primary key and using BTREE', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY USING BTREE (id));`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint primary key and using HASH', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY USING HASH (id));`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "HASH"
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with simple constraint FOREIGN KEY', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (id),
                      FOREIGN KEY (user_id) REFERENCES another_table_name (id));`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                },{
                    "non_unique": 1,
                    "key_name": "user_id",
                    "key_type": "FOREIGN",
                    "column_name": "user_id",
                    "references": {
                        "tableName": "another_table_name",
                        "columns": "id"
                    }
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint FOREIGN KEY on delete cascade', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (id),
                      FOREIGN KEY (user_id) REFERENCES another_table_name (id) ON DELETE CASCADE);`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                },{
                    "non_unique": 1,
                    "key_name": "user_id",
                    "key_type": "FOREIGN",
                    "column_name": "user_id",
                    "references": {
                        "tableName": "another_table_name",
                        "columns": "id",
                        "onDelete": "CASCADE"
                    }
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint FOREIGN KEY on update cascade', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (id),
                      FOREIGN KEY (user_id) REFERENCES another_table_name (id) ON UPDATE CASCADE);`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                },{
                    "non_unique": 1,
                    "key_name": "user_id",
                    "key_type": "FOREIGN",
                    "column_name": "user_id",
                    "references": {
                        "tableName": "another_table_name",
                        "columns": "id",
                        "onUpdate": "CASCADE"
                    }
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint FOREIGN KEY on update and delete cascade', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (id),
                      FOREIGN KEY (user_id) REFERENCES another_table_name (id) ON DELETE CASCADE ON UPDATE CASCADE);`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                },{
                    "non_unique": 1,
                    "key_name": "user_id",
                    "key_type": "FOREIGN",
                    "column_name": "user_id",
                    "references": {
                        "tableName": "another_table_name",
                        "columns": "id",
                        "onDelete": "CASCADE",
                        "onUpdate": "CASCADE"
                    }
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
    it('converts creating with constraint FOREIGN KEY on update and delete cascade with different order', function() {
        var sSQL = `CREATE TABLE new_complicated_table (
                      id bigint(50) NOT NULL,
                      user_id varchar(255) binary NOT NULL,
                      PRIMARY KEY (id),
                      FOREIGN KEY (user_id) REFERENCES another_table_name (id) ON UPDATE CASCADE ON DELETE CASCADE);`;
        var expectedObj = {
            "new_complicated_table": {
                columns: [{
                    "field": "id",
                    "type": "bigint(50)",
                    "null": false,
                    "default": ""
                },{
                    "field": "user_id",
                    "type": "varchar(255)",
                    "null": false,
                    "default": ""
                }],
                indexes: [{
                    "non_unique": 0,
                    "key_name": "PRIMARY",
                    "key_type": "PRIMARY",
                    "column_name": "id",
                    "index_type": "BTREE"
                },{
                    "non_unique": 1,
                    "key_name": "user_id",
                    "key_type": "FOREIGN",
                    "column_name": "user_id",
                    "references": {
                        "tableName": "another_table_name",
                        "columns": "id",
                        "onDelete": "CASCADE",
                        "onUpdate": "CASCADE"
                    }
                }]
            }
        };
        assert.deepEqual(mysqlToObjParser.parse(sSQL), expectedObj);
    });
});