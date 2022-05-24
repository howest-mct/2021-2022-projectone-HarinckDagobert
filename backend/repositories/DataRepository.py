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