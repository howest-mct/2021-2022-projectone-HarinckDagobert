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
        sql = "SELECT volgnummer, CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek"
        return Database.get_rows(sql)

    @staticmethod
    def read_historiek_by_date(date):
        sql = "SELECT volgnummer, CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek WHERE datum BETWEEN %s AND %s"
        date1 = date + ' 00:00:00'
        date2 = date + ' 23:59:59'
        params = [date1,date2]
        return Database.get_rows(sql,params)
    
    @staticmethod
    def read_historiek_by_device(deviceid):
        sql = "SELECT volgnummer, CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek WHERE deviceid = %s"
        params = [deviceid]
        return Database.get_rows(sql,params)
    
    @staticmethod
    def read_historiek_by_date_en_device(deviceid,date):
        sql = "SELECT volgnummer, CAST(datum AS char) AS 'datum', waarde, commentaar, deviceid, actieid from historiek WHERE deviceid = %s AND datum BETWEEN %s AND %s"
        date1 = date + ' 00:00:00'
        date2 = date + ' 23:59:59'
        params = [deviceid, date1,date2]
        return Database.get_rows(sql,params)

    @staticmethod
    def insert_into_historiek(waarde,commentaar,deviceid,actieid):
        sql = "INSERT INTO historiek(waarde,commentaar,deviceid,actieid) VALUES(%s,%s,%s,%s)"
        params = [waarde,commentaar,deviceid,actieid]
        return Database.execute_sql(sql,params)

    @staticmethod
    def read_maxmin_device():
        sql = "SELECT deviceid,maxminWaarde FROM device WHERE maxminWaarde is not null"
        return Database.get_rows(sql)
    
    @staticmethod
    def update_device(waardewind, waardelicht, waardetemp):
        sql = "UPDATE device SET maxminWaarde = CASE deviceid WHEN 1 THEN %s WHEN 2 THEN %s WHEN 3 THEN %s END WHERE deviceid IN (1,2,3);"
        params = [waardewind, waardelicht, waardetemp]
        return Database.execute_sql(sql,params)