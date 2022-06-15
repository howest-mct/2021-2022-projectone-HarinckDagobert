from .Database import Database


class DataRepository:
    @staticmethod
    def json_or_formdata(request):
        if request.content_type == 'application/json':
            gegevens = request.get_json()
        else:
            gegevens = request.form.to_dict()
        return gegevens

    @staticmethod
    def read_historiek():
        sql = "SELECT volgnummer, CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek ORDER by datum DESC"
        return Database.get_rows(sql)   

    @staticmethod
    def read_historiek_by_device(deviceid):
        sql = "SELECT volgnummer,CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek WHERE deviceid = %s"
        params = [deviceid]
        return Database.get_rows(sql,params)

    @staticmethod
    def read_historiek_today_by_device(deviceid):
        sql = "SELECT volgnummer, CAST(CAST(datum AS time) AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek WHERE deviceid = %s and DATE(datum) = CURDATE()"
        params = [deviceid]
        return Database.get_rows(sql,params)

    @staticmethod
    def insert_into_historiek(waarde,commentaar,deviceid,actieid):
        sql = "INSERT INTO historiek(waarde,commentaar,deviceid,actieid) VALUES(%s,%s,%s,%s)"
        params = [waarde,commentaar,deviceid,actieid]
        return Database.execute_sql(sql,params)

    @staticmethod
    def read_maxmin_device():
        sql = "SELECT parid,waarde FROM parameters"
        return Database.get_rows(sql)
    
    @staticmethod
    def update_device(waardewind, waardelicht, waardetemp,dagen):
        sql = "UPDATE parameters SET waarde = CASE parid WHEN 1 THEN %s WHEN 2 THEN %s WHEN 3 THEN %s WHEN 4 THEN %s END WHERE parid IN (1,2,3,4);"
        params = [waardewind, waardelicht, waardetemp,dagen]
        return Database.execute_sql(sql,params)