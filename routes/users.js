'user strict';
var express = require('express');
var connect =  require('../db/db.js');
var tool = require('../tool/tool.js');

module.exports = {
    //计算user数量
    getCountUser:function(req,res,next){
        let name = req.body.name || '',
            number = req.body.number || '',
            startDate = req.body.startDate || '',
            endDate = req.body.endDate || '';
        let sql = 'select count(id) as count from user where role != "0"';
        if(!tool.isEmpty(name)){
            sql += ' and name like "%'+ name+'%"';
        }
        if(!tool.isEmpty(number)){
            sql += ' and number='+ number;
        }
        if(!tool.isEmpty(startDate)){
            sql += ' and join_date > '+ startDate;
        }
        if(!tool.isEmpty(endDate)){
            sql += ' and join_date < '+ endDate;
        }
        connect.query(sql, function (error, results, fields) {
            if (error) {
                res.end(JSON.stringify({
                    resultCode : '-1',
                    message:'query failed'
                }));
                return;
            };
            res.end(JSON.stringify(results[0]));
        });
    },
    getUserList:function(req,res,next){
        let name = req.body.name || '',
            number = req.body.number || '',
            startDate = req.body.startDate || '',
            endDate = req.body.endDate || '',
            pageNo = req.body.pageNo || 1,
            pageSize = req.body.pageSize || 10;
        let sql = 'select * from user where role != "0"';
        if(!tool.isEmpty(name)){
            sql += ' and name like "%'+ name+'%"';
        }
        if(!tool.isEmpty(number)){
            sql += ' and number='+ number;
        }
        if(!tool.isEmpty(startDate)){
            sql += ' and join_date > '+ startDate;
        }
        if(!tool.isEmpty(endDate)){
            sql += ' and join_date < '+ endDate;
        }
        sql += ' order by number asc limit '+(pageNo-1)*pageSize+','+pageNo*pageSize;
        console.log(sql);
        connect.query(sql, function (error, results, fields) {
            console.log(error);
            if (error) {
                res.end(JSON.stringify({
                    resultCode : '-1',
                    message:'query failed'
                }));
                return;
            };
            console.log(results);
            res.end(JSON.stringify(results));
        });
    },
  getUserInfo:function(req,res,next){
    let id = req.query.id;
    if(tool.isEmpty(id)){
      res.end(JSON.stringify({
        resultCode : '-1',
        message:'param error'
      }));
      return;
    }
    let sql = 'select * from user where id='+id;
    console.log(sql);
    connect.query(sql, function (error, results, fields) {
        if (error) {
            res.end(JSON.stringify({
                resultCode : '-1',
                message:'query failed'
            }));
            return;
        };
        console.log(results[0]);
        res.end(JSON.stringify(results));
    });
  },
  addUser:function(req,res,next){
      let user = req.body;
      connect.query('select id from user where number="'+user.number+'"',function(err,result){
          console.log(result);
          if(result.length > 0){
              res.end(JSON.stringify({
                  resultCode : '-1',
                  message:'该工号已经存在'
              }));
              return;
          }else{
              let sql = 'insert into user value(?,?,?,?,?,?,?,?,now(),?,?,?,?,?,?)';
              let params = [tool.uuid(),user.number,user.name,'flaginfo123',user.mobile,user.tel,user.email,user.date,null,null,user.role,user.gender,user.position,user.desc];
              console.log(params);
              connect.query(sql,params,function(err,result){
                  console.log(err);
                  if(err){
                      console.log(err)
                      res.end(JSON.stringify({
                          resultCode : '-1',
                          message:'add failed'
                      }));
                  }else{
                      res.end(JSON.stringify({
                          resultCode : '200',
                          body:{}
                      }));
                  }

              });
          }
      });

  },
  updateUser:function(req,res,next){
    let user = req.query.user;
    let sql = 'update user set name=?,mobile=?,tel=?,email=?,update_date=now,position=?,desc=? where id="'+user.id+'"';
    let params = [user.name,user.mobile,user.tel,user.email,user.position,user.desc];
    connect.query(sql,params,function(err,result){
      if(err){
        res.end(JSON.stringify({
            resultCode : '-1',
            message:'update failed'
        }));
        return;
      }
      res.end(JSON.stringify({
          resultCode : '200',
          body:{}
      }));
    });
  },
  deleteUser:function(req,res,next){
    let id = req.body.id;
    if(tool.isEmpty(id)){
      res.end(JSON.stringify({
        resultCode : '-1',
        message:'param error'
      }));
      return;
    }
    let sql = "delete from user where id='"+id+"'";
    console.log(sql);
    connect.query(sql,function(err,result){
      if(err){
        res.end(JSON.stringify({
          resultCode : '-1',
          message:'delete failed'
        }));
        return;
      }
    });
    let leave_sql = 'delete from leave_bill where user_id="'+id+'"';
    connect.query(leave_sql,function(err,result){
        if(err){
            res.end(JSON.stringify({
                resultCode : '-1',
                message:'delete failed'
            }));
            return;
        }
    });
    let overtime_sql = 'delete from overtime_bill where user_id="'+id+'"';
    connect.query(overtime_sql,function(err,result){
        if(err){
            res.end(JSON.stringify({
                resultCode : '-1',
                message:'delete failed'
            }));
            return;
        }
        res.end(JSON.stringify({
            resultCode : '200',
            message:'delete success'
        }));
    });
  },
  login:function(req,res,next){
      console.log(req.body);
      let username = req.body.username,
          password = req.body.password;
      let sql = "select * from user where name='"+username+ "' and password='"+password+"'";
      console.log('==================login:'+sql+'=====================');
      connect.query(sql,function(err,result){
          console.log(result);
          let user = result[0];
          if(result.length == 0){
              res.end(JSON.stringify({
                  resultCode : '-1',
                  message:'user not exist'
              }));
          }else{
              console.log('============='+user.name+'已经登录===============');
              req.session.user = user;
              res.end(JSON.stringify({
                  resultCode:'200',
                  body:user
              }));
          }
      })
  },
  logout:function(req,res,next){
      req.session.destroy(function(){
          res.end(JSON.stringify({
              resultCode:'200',
              message:'user logout'
          }));
      })
  },
  changePassword:function(req,res,next){
      let user = req.query.user;
      let sql = 'update user set password="'+req.body.password+'"';
      connect.query(sql,function(err,result){
          if(err){
              res.end(JSON.stringify({
                  resultCode : '-1',
                  message:'update failed'
              }));
          }else{
              res.end(JSON.stringify({
                  resultCode : '200',
                  body:{}
              }));
          }

      });
  }
}
