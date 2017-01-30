var assert = require('assert');
var mysqlToObjParser = require('../index.js');

describe('parse CREATE FUNCTION', function() {
    it('converts simple creation', function() {
        var sSQL = `CREATE FUNCTION DATE_CONVERT_TO_MILLIS (date DATETIME)
                    RETURNS BIGINT
                    DETERMINISTIC
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "DATE_CONVERT_TO_MILLIS",
                parameters: ['date DATETIME'],
                returnType: 'BIGINT',
                characteristic: "DETERMINISTIC",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation with DEFINER CURRENT_USER', function() {
        var sSQL = `CREATE DEFINER = CURRENT_USER FUNCTION DATE_CONVERT_TO_MILLIS (date DATETIME)
                    RETURNS BIGINT
                    DETERMINISTIC
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "DATE_CONVERT_TO_MILLIS",
                definer: "CURRENT_USER",
                parameters: ['date DATETIME'],
                returnType: 'BIGINT',
                characteristic: "DETERMINISTIC",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation with DEFINER some_user_name', function() {
        var sSQL = `CREATE DEFINER = some_user_name FUNCTION DATE_CONVERT_TO_MILLIS (date DATETIME)
                    RETURNS BIGINT
                    DETERMINISTIC
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "DATE_CONVERT_TO_MILLIS",
                definer: "some_user_name",
                parameters: ['date DATETIME'],
                returnType: 'BIGINT',
                characteristic: "DETERMINISTIC",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation with some parameters', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    DETERMINISTIC
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "DETERMINISTIC",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation NOT DETERMINISTIC', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    NOT DETERMINISTIC
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "NOT DETERMINISTIC",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation LANGUAGE SQL', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    LANGUAGE SQL
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "LANGUAGE SQL",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation CONTAINS SQL', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    CONTAINS SQL
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "CONTAINS SQL",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation NO SQL', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    NO SQL
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "NO SQL",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation READS SQL DATA', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    READS SQL DATA
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "READS SQL DATA",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation MODIFIES SQL DATA', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    MODIFIES SQL DATA
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "MODIFIES SQL DATA",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation SQL SECURITY DEFINER', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    SQL SECURITY DEFINER
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "SQL SECURITY DEFINER",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
    it('converts creation SQL SECURITY INVOKER', function() {
        var sSQL = `CREATE FUNCTION some_func_name (BIGINT param1, INT param2    ,   DOUBLE Param3)
                    RETURNS BIGINT
                    SQL SECURITY INVOKER
                    RETURN UNIX_TIMESTAMP(date) * 1000;`;
        var expectedObj = {
            "functions": [{
                name: "some_func_name",
                parameters: ['BIGINT param1', 'INT param2', 'DOUBLE Param3'],
                returnType: 'BIGINT',
                characteristic: "SQL SECURITY INVOKER",
                routineBody: "RETURN UNIX_TIMESTAMP(date) * 1000"
            }]
        };
        var obj = mysqlToObjParser.parse(sSQL);
        assert.deepEqual(obj, expectedObj);
    });
});