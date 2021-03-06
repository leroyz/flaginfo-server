'user strict';

var express = require('express');
var connect =  require('../db/db.js');
var tool = require('../tool/tool.js');

module.exports = {
    addLeaveBill:function(req,res,next){
        let params = req.body;
        console.log(params);
        let sql = 'insert into leave_bill values(?,?,?,?,?,?)';
        let values = [tool.uuid(),params.userId,params.beginTime,params.endTime,params.content,
            Math.floor((new Date(params.endTime) - new Date(params.beginTime))/1000/60/60)];
        console.log(values);
        connect.query(sql,values,function(err,result){
            if(err){
                console.log(err);
                res.end(JSON.stringify({
                    resultCode:'-1',
                    message:'add failed'
                }));
            }else{
                res.end(JSON.stringify({
                    resultCode:'200',
                    body:{}
                }));
            }
        });
    },
    getMyLeaveList:function(req,res,next){
        var params = req.body;
        var resultData = {};
        var sql = 'select * from leave_bill where user_id = "'+params.userId+'"';
        if(!tool.isEmpty(params.beginTime)){
            sql += ' and begin_date > "'+params.beginTime+'"';
        }
        if(!tool.isEmpty(params.endTime)){
            sql += ' and end_date < "'+ params.endTime+'"';
        }
        console.log(sql);
        connect.query(sql,function(err,result){
            if(err){
                console.log(err);
                res.end(JSON.stringify({
                    resultCode:'-1',
                    message:'query failed'
                }));
            }else{
                resultData['total'] = result.length;
                sql += ' limit '+(params.pageNo-1)*params.pageSize+','+params.pageNo*params.pageSize;
                connect.query(sql,function(err,result){
                    if(err){
                        res.end(JSON.stringify({
                            resultCode:'-1',
                            message:'query failed'
                        }));
                    }else{
                        resultData['list'] = result;
                        res.end(JSON.stringify({
                            resultCode:'200',
                            body:resultData
                        }));
                    }
                });
            }
        });
    },
    getLeaveStatistic:function(req,res,next){
        let option = req.body;
        console.log(option);
        let sql = 'SELECT o.id,o.number,o.name,sum(leave_bill.time) AS leavetime,o.overtime '+
                    'FROM(select user.id,user.number,user.name,user.role,'+
                    'sum(overtime_bill.time) AS overtime '+
                    'from user LEFT JOIN overtime_bill ON user.id = overtime_bill.user_id '+
                    'WHERE user.role != 0 ) AS o '+
                    'LEFT JOIN leave_bill ON o.id = leave_bill.user_id '+
                    'WHERE o.role != 0';
        if(!tool.isEmpty(option.username)){
            sql += ' and o.name like "%'+option.username+'%"';
        }
        if(!tool.isEmpty(option.number)){
            sql += ' and o.number ='+option.number;
        }
        if(!tool.isEmpty(option.beginTime)){
            sql += ' and leave_bill.begin_date > "'+option.beginTime+'"';
        }
        if(!tool.isEmpty(option.endTime)){
            sql += ' and leave_bill.end_date < "'+option.endTime+'"';
        }
        // sql += ' group by user.name';
        console.log('==============='+sql);
        connect.query(sql,function(err,result){
            if(err){
                console.log(err)
                res.end(JSON.stringify({
                    resultCode:'-1',
                    message:'query failed'
                }));
            }else{
                console.log(result);
                res.end(JSON.stringify({
                    resultCode:'200',
                    body:result
                }));
            }
        });
    }
}