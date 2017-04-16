(function(module) {
    "use strict";
    //感谢各位的支持，如果可能，我以后会使用es6/7的技术重写本插件的
    
    //声明所需的模块
    var User = module.parent.require('./user'),
        db = module.parent.require('../src/database'),
        meta = module.parent.require('./meta'),
        async = module.parent.require('async'),
        nconf = module.parent.require('nconf'),
        passport = module.parent.require('passport'),
        QQStrategy = require('passport-qq2015-fix').Strategy,
        fs = module.parent.require('fs'),
		path = module.parent.require('path');
	var authenticationController = module.parent.require('./controllers/authentication');
    
    //定义本插件的一些信息
    var constants = Object.freeze({
        'name': "QQ",
        'admin': {
            'icon': 'fa-qq',
            'route': '/plugins/sso-qq'
        }
    });

    /**
     * 转半角字符
     */
    function toSBC(str){
        var result = "";
        var len = str.length;
        for(var i=0;i<len;i++)
        {
            var cCode = str.charCodeAt(i);
            //全角与半角相差（除空格外）：65248（十进制）
            cCode = (cCode>=0xFF01 && cCode<=0xFF5E)?(cCode - 65248) : cCode;
            //处理空格
            cCode = (cCode==0x03000)?0x0020:cCode;
            result += String.fromCharCode(cCode);
        }
        return result;
    }
    
    /**
    *  中文符号转英文符号
    */
    function zhtoEN(s){
        s=s.replace(/：/g,':');  
        s=s.replace(/。/g,'.');  
        s=s.replace(/“/g,'"');  
        s=s.replace(/”/g,'"');  
        s=s.replace(/【/g,'[');  
        s=s.replace(/】/g,']');  
        s=s.replace(/《/g,'<');  
        s=s.replace(/》/g,'>');  
        s=s.replace(/，/g,',');  
        s=s.replace(/？/g,'?');  
        s=s.replace(/、/g,',');  
        s=s.replace(/；/g,';');  
        s=s.replace(/（/g,'(');  
        s=s.replace(/）/g,')');  
        s=s.replace(/‘/g,"'");  
        s=s.replace(/’/g,"'");  
        s=s.replace(/『/g,"[");  
        s=s.replace(/』/g,"]");  
        s=s.replace(/「/g,"[");  
        s=s.replace(/」/g,"]");  
        s=s.replace(/﹃/g,"[");  
        s=s.replace(/﹄/g,"]");  
        s=s.replace(/〔/g,"{");  
        s=s.replace(/〕/g,"}");  
        s=s.replace(/—/g,"-");  
        s=s.replace(/·/g,".");  
        return s;
    }
    var QQ = {};//初始化对象

    //配置好QQ的passport验证器
    QQ.getStrategy = function(strategies, callback) {
        //获取配置
        meta.settings.get('sso-qq', function(err, settings) {
            if (!err && settings['id'] && settings['secret']) {
                //console.log(settings);
                
                //配置passort
                passport.use('qq-token', new QQStrategy({
                    clientID: settings['id'],
                    clientSecret: settings['secret'],
                    callbackURL: nconf.get('url') + '/auth/qq/callback',
                    passReqToCallback: true
                }, function(req,accessToken, refreshToken, profile, done) {
                    //console.log("[SSO-QQ]accessToken:"+accessToken);
                    //console.log("[SSO-QQ]refreshToken:"+refreshToken);
                    //console.log("[SSO-QQ]profile:");
                    //console.log(profile);
                    //console.log("[SSO-QQ]req:");
                    //console.log(req);
                    profile = JSON.parse(profile);
                    if (!profile) {
                            return done(null, false);
                        }else{
                        
                        if (profile.ret == -1){ // Try Catch Error
                            console.log("[SSO-QQ]The Profile return -1,skipped.");
                            return done("There's something wrong with your request or QQ Connect API.Please try again.",false);
                        }
                        
                        //存储头像信息
                        profile.avatar = (profile.figureurl_qq_2 == null) ?  profile.figureurl_qq_1 : profile.figureurl_qq_2; // Set avatar image
                        console.log("[SSO-QQ]Username:"+profile.nickname);
                        console.log("[SSO-QQ]qqID:"+profile.id);
                        console.log("[SSO-QQ]avatar_url:"+profile.avatar);
                    
                    //如果用户已经登录，那么我们就绑定他    
                    if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
						//如果用户想重复绑定的话，我们就拒绝他。
						if(QQ.getQQIDbyuid(req.user.uid) == profile.id){
						    done("You have binded a QQ account.If you want to bind another one ,please unbind your accound.",flase);
						}
						
						// Save qq-specific information to the user
						console.log("[SSO-QQ]User is logged.Binding.");
						console.log("[SSO-QQ]req.user:");
						console.log(req.user);
						User.setUserField(req.user.uid, 'qqid', profile.id);
						db.setObjectField('qqid:uid', profile.id, req.user.uid);
						console.log(`[SSO-QQ] ${req.user.uid} is binded.`);
						return done(null,req.user);
						
						
					}
                    
                    //登录方法
                    QQ.login(profile.id,profile.nickname,profile.avatar, function(err, user) { //3.29 add avatar
                        if (err) {
                           return done(err);
                        }
                        authenticationController.onSuccessfulLogin(req, user.uid);
						done(null, user);
                    });
                        
                        
                        }
                }));
                
                //定义本插件的一些信息
                strategies.push({
                    name: 'qq-token',
                    url: '/auth/qq',
                    callbackURL: '/auth/qq/callback',
                    icon: 'fa-qq',
                    scope: 'get_user_info'
                    
                });
            }

            callback(null, strategies);
        });
    };
    
    //通过UID获取QQid    
    QQ.getQQIDbyuid = function(uid){
        db.getObjectField('uid:qqid', uid, function(err, qqid) {
			if (err) {
				console.log(`[SSO-QQ]get a error:${err},While get QQID by uid`);
				return false;
			} else {
				return qqid;
			}
		});
    }
    
    
    QQ.getAssociation = function(data, callback) {
		User.getUserField(data.uid, 'qqid', function(err, qqid) {
			if (err) {
				return callback(err, data);
			}

			if (qqid) {
				data.associations.push({
					associated: true,
					name: constants.name,
					icon: constants.admin.icon
					
				});
			} else {
				data.associations.push({
					associated: false,
					url: nconf.get('url') + '/auth/qq',
					name: constants.name,
					icon: constants.admin.icon
				});
			}

			callback(null, data);
		})
	};
    QQ.login = function(qqID, username,avatar ,callback) {
        QQ.getUidByQQID(qqID, function(err, uid) {
            if (err) {
                return callback(err);
            }
            
            console.log("[SSO-QQ]uid:"+uid);
            if (uid !== null) {
                // Existing User
                console.log("[SSO-QQ]User is Exist.logging...");
                return callback(null, {
                    uid: uid
                });
            } else {
                //为了放置可能导致的修改用户数据，结果重新建立了一个账户的问题，所以我们给他一个默认邮箱
                let email = qqID+"@norelpy.qq.com";
                console.log("[SSO-QQ]User isn't Exist.Try to Creat a new account.");
                console.log("[SSO-QQ]New Account's Username：" + username);
				console.log("[SSO-QQ]New Account's Email：" + email);
				// New User 
				
				/**
				 * 转义Username
				 */
				    //中文符号到英文
				    username = zhtoEN(username);
				    //全角转半角
				    username = toSBC(username);
				    // 去掉转义字符  
				    username = username.replace(/[\'\"\\\/\b\f\n\r\t]/g, '');
				    //去除特殊符号
				    username = username.replace(/[\@\#\$\%\^\&\*\{\}\:\"\L\?\\(\)]/,""); //2017.04.16 增加括号
				//End
				
				//From SSO-Twitter
				User.create({username: username,email:email}, function (err, uid) {
					if (err) {
						return callback(err);
					}

					// Save qq-specific information to the user
					User.setUserField(uid, 'qqid', qqID);
					db.setObjectField('qqid:uid', qqID, uid);
					
					// Save their photo, if present
					if (avatar && avatar.length > 0) {
						var photoUrl = avatar[0].value;
						//photoUrl = path.dirname(photoUrl) + '/' + path.basename(photoUrl, path.extname(photoUrl)).slice(0, -6) + 'bigger' + path.extname(photoUrl);
						User.setUserField(uid, 'uploadedpicture', photoUrl);
						User.setUserField(uid, 'picture', photoUrl);
					}

					callback(null, {
						uid: uid
					});
				});
				
			}
                
        });
    };

    QQ.getUidByQQID = function(qqID, callback) {
		db.getObjectField('qqid:uid', qqID, function(err, uid) {
			if (err) {
				callback(err);
			} else {
				callback(null, uid);
			}
		});
	};

    QQ.addMenuItem = function(custom_header, callback) {
        custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": "QQ 社会化登陆"
		});

		callback(null, custom_header);
    };

   QQ.init = function(data, callback) {
        function renderAdmin(req, res) {
            res.render('admin/plugins/sso-qq', {
                callbackURL: nconf.get('url') + '/auth/qq/callback'
            });
        }
        data.router.get('/admin/plugins/sso-qq', data.middleware.admin.buildHeader, renderAdmin);
        data.router.get('/api/admin/plugins/sso-qq', renderAdmin);
        callback();
    };
    //预留解绑的锅子
    QQ.unbindedQQID = function(uid){
        
    }
    //删除用户时触发的事件
    QQ.deleteUserData = function (uid, callback) {
		async.waterfall([
			async.apply(User.getUserField, uid, 'qqid'),
			function (oAuthIdToDelete, next) {
				db.deleteObjectField('qqid:uid', oAuthIdToDelete, next);
				console.log(`[sso-qq]uid: ${uid} 's data have removed succesfully.`);
			}
		], function (err) {
			if (err) {
				winston.error('[sso-qq] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

    module.exports = QQ;
}(module));
