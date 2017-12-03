(function (module) {
  'use strict'
  // 感谢各位的支持，如果可能，我以后会使用es6/7的技术重写本插件的

  // 声明所需的模块
  const User = module.parent.require('./user')
  const db = module.parent.require('../src/database')
  const meta = module.parent.require('./meta')
  const async = module.parent.require('async')
  const nconf = module.parent.require('nconf')
  // const utils = module.parent.require('../public/src/utils')
  const passport = module.parent.require('passport')
  const QQStrategy = require('passport-qq2015-fix').Strategy
  // const fs = module.parent.require('fs')
  const winston = module.parent.require('winston')
  // const path = module.parent.require('path')
  const authenticationController = module.parent.require('./controllers/authentication')

  // 定义本插件的一些信息
  const constants = Object.freeze({
    'name': 'QQ',
    'admin': {
      'icon': 'fa-qq',
      'route': '/plugins/sso-qq'
    }
  })

  const QQ = {} // 初始化对象

  // 配置好QQ的passport验证器
  QQ.getStrategy = function (strategies, callback) {
    // 获取配置
    meta.settings.get('sso-qq', function (err, settings) {
      if (!err && settings['id'] && settings['secret']) {
        // 配置passort
        passport.use('qq-token', new QQStrategy({
          clientID: settings['id'],
          clientSecret: settings['secret'],
          callbackURL: nconf.get('url') + '/auth/qq/callback',
          passReqToCallback: true
        }, function (req, accessToken, refreshToken, profile, done) {
          profile = JSON.parse(profile)
          if (profile.ret === -1) { // Try Catch Error
            winston.error('[SSO-QQ]The Profile return -1,skipped.')
            return done(new Error("There's something wrong with your request or QQ Connect API.Please try again."))
          }
          // 存储头像信息
          let avatar = (profile.figureurl_qq_2 == null) ? profile.figureurl_qq_1 : profile.figureurl_qq_2 // Set avatar image
          avatar = avatar.replace('http://', 'https://')
          // 如果用户已经登录，那么我们就绑定他
          if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
            // 如果用户想重复绑定的话，我们就拒绝他。
            QQ.hasQQID(profile.id, function (err, res) {
              if (err) {
                winston.error(err)
                return done(err)
              } else {
                if (res) {
                  winston.error('[sso-qq] qqid:' + profile.id + 'is binded.')
                  // qqid is exist
                  return done(new Error('You have binded a QQ account.If you want to bind another one ,please unbind your accound.'), false)
                } else {
                  User.setUserField(req.user.uid, 'qqid', profile.id)
                  db.setObjectField('qqid:uid', profile.id, req.user.uid)
                  User.setUserField(req.user.uid, 'qqpic', avatar)
                  winston.info('[sso-qq]user:' + req.user.uid + 'is binded.(openid is ' + profile.id + ' and nickname is ' + profile.nickname + ')')
                  return done(null, req.user)
                }
              }
            })
          } else {
            // 登录方法
            var email = profile.id + '@noreply.qq.com'
            QQ.login(profile.id, profile.nickname, avatar, email, function (err, user) { // 3.29 add avatar
              if (err) {
                return done(err)
              } else {
                // Require collection of email
                if (email.endsWith('@norelpy.qq.com') || email.endsWith('@noreply.qq.com')) {
                  req.session.registration = req.session.registration || {}
                  req.session.registration.uid = user.uid
                  req.session.registration.qqid = profile.id
                }
                authenticationController.onSuccessfulLogin(req, user.uid, function (err) {
                  if (err) {
                    return done(err)
                  } else {
                    return done(null, user)
                  }
                })
              }
            })
          }
        }))

        // 定义本插件的一些信息
        strategies.push({
          name: 'qq-token',
          url: '/auth/qq',
          callbackURL: '/auth/qq/callback',
          icon: 'fa-qq',
          scope: 'get_user_info'
        })
      };
      callback(null, strategies)
    })
  }

  // 通过UID获取QQid
  QQ.hasQQID = function (qqid, callback) {
    db.isObjectField('qqid:uid', qqid, function (err, res) {
      if (err) {
        callback(err)
      } else {
        callback(null, res)
      }
    })
  }

  QQ.getAssociation = function (data, callback) {
    User.getUserField(data.uid, 'qqid', function (err, qqid) {
      if (err) {
        return callback(err, data)
      }

      if (qqid) {
        data.associations.push({
          associated: true,
          deauthUrl: nconf.get('url') + '/deauth/qq',
          name: constants.name,
          icon: constants.admin.icon
        })
      } else {
        data.associations.push({
          associated: false,
          url: nconf.get('url') + '/auth/qq',
          name: constants.name,
          icon: constants.admin.icon
        })
      }

      callback(null, data)
    })
  }
  QQ.login = function (qqID, username, avatar, email, callback) {
    QQ.getUidByQQID(qqID, function (err, uid) {
      if (err) {
        return callback(err)
      }

      // winston.verbose("[SSO-QQ]uid:" + uid);
      if (uid !== null) {
        // Existing User
        winston.info('[SSO-QQ]User:' + uid + ' is logged via sso-qq')
        User.setUserField(uid, 'qqpic', avatar) // 更新头像
        return callback(null, {
          uid: uid
        })
      } else {
        // 为了放置可能导致的修改用户数据，结果重新建立了一个账户的问题，所以我们给他一个默认邮箱
        winston.info("[SSO-QQ]User isn't Exist.Try to Creat a new account.")
        winston.info("[SSO-QQ]New Account's Username：" + username + ' and openid:' + qqID)
        // New User
        // From SSO-Twitter
        User.create({
          username: username,
          email: email
        }, function (err, uid) {
          if (err) {
            User.create({
              username: 'QQ-' + qqID,
              email: email
            }, function (err, uid) {
              if (err) {
                return callback(err)
              } else {
                // Save qq-specific information to the user
                User.setUserField(uid, 'qqid', qqID)
                db.setObjectField('qqid:uid', qqID, uid)
                // Save their photo, if present
                User.setUserField(uid, 'picture', avatar)
                User.setUserField(uid, 'qqpic', avatar)
                callback(null, {
                  uid: uid
                })
              }
            })
          } else {
            // Save qq-specific information to the user
            User.setUserField(uid, 'qqid', qqID)
            db.setObjectField('qqid:uid', qqID, uid)
            // Save their photo, if present
            User.setUserField(uid, 'picture', avatar)
            User.setUserField(uid, 'qqpic', avatar)
            callback(null, {
              uid: uid
            })
          }
        })
      }
    })
  }

  QQ.getUidByQQID = function (qqID, callback) {
    db.getObjectField('qqid:uid', qqID, function (err, uid) {
      if (err) {
        callback(err)
      } else {
        callback(null, uid)
      }
    })
  }

  QQ.addMenuItem = function (header, callback) {
    header.authentication.push({
      'route': constants.admin.route,
      'icon': constants.admin.icon,
      'name': 'QQ 社会化登陆'
    })

    callback(null, header)
  }

  QQ.init = function (data, callback) {
    var hostHelpers = require.main.require('./src/routes/helpers')

    function renderAdmin (req, res) {
      res.render('admin/plugins/sso-qq', {
        callbackURL: nconf.get('url') + '/auth/qq/callback'
      })
    }
    data.router.get('/admin/plugins/sso-qq', data.middleware.admin.buildHeader, renderAdmin)
    data.router.get('/api/admin/plugins/sso-qq', renderAdmin)
    hostHelpers.setupPageRoute(data.router, '/deauth/qq', data.middleware, [data.middleware.requireUser], function (req, res) {
      res.render('partials/sso-qq/deauth', {
        service: 'QQ'
      })
    })
    data.router.post('/deauth/qq', data.middleware.requireUser, function (req, res, next) {
      QQ.deleteUserData({
        uid: req.user.uid
      }, function (err, uid) {
        if (err) {
          return next(err)
        }
        User.getUserField(uid, 'userslug', function (err, userslug) {
          if (err) {
            return next(err)
          }
          res.redirect(nconf.get('relative_path') + '/user/' + userslug + '/edit')
        })
      })
    })
    callback()
  }

  QQ.appendUserHashWhitelist = function (data, callback) {
    data.whitelist.push('qqid')
    data.whitelist.push('qqpic')
    return setImmediate(callback, null, data)
  }

  // 删除用户时触发的事件
  QQ.deleteUserData = function (data, callback) {
    const uid = data.uid

    async.waterfall([
      async.apply(User.getUserField, uid, 'qqid'),
      function (oAuthIdToDelete, next) {
        db.deleteObjectField('qqid:uid', oAuthIdToDelete, next)
      },
      function (next) {
        db.deleteObjectField('user:' + uid, 'qqid', next)
      }
    ], function (err) {
      if (err) {
        winston.error('[sso-qq] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err)
        return callback(err)
      }
      callback(null, uid)
    })
  }
  QQ.prepareInterstitial = (data, callback) => {
    // Only execute if:
    //   - uid and qqid are set in session
    //   - email ends with "@noreply.qq.com"
    if (data.userData.hasOwnProperty('uid') && data.userData.hasOwnProperty('qqid')) {
      User.getUserField(data.userData.uid, 'email', function (err, email) {
        if (err) {
          return callback(err)
        }
        if (email && (email.endsWith('@noreply.qq.com') || email.endsWith('@norelpy.qq.com'))) {
          data.interstitials.push({
            template: 'partials/sso-qq/email.tpl',
            data: {},
            callback: QQ.storeAdditionalData
          })
        }

        callback(null, data)
      })
    } else {
      callback(null, data)
    }
  }
  QQ.get = (data, callback) => {
    if (data.type === 'qq') {
      QQ.getQQPicture(data.uid, function (err, QQPicture) {
        if (err) {
          winston.error(err)
          return callback(null, data)
        }
        if (QQPicture == null) {
          winston.error('[sso-qq]uid:' + data.uid + 'is invalid,skipping...')
          return callback(null, data)
        }
        data.picture = QQPicture
        callback(null, data)
      })
    } else {
      callback(null, data)
    }
  }
  QQ.list = (data, callback) => {
    QQ.getQQPicture(data.uid, function (err, QQPicture) {
      if (err) {
        winston.error(err)
        return callback(null, data)
      }
      if (QQPicture == null) {
        winston.error('[sso-qq]uid:' + data.uid + 'is invalid,skipping...')
        return callback(null, data)
      }
      data.pictures.push({
        type: 'qq',
        url: QQPicture,
        text: 'QQ头像'
      })
      callback(null, data)
    })
  }
  QQ.getQQPicture = function (uid, callback) {
    User.getUserField(uid, 'qqpic', function (err, pic) {
      if (err) {
        return callback(err)
      }
      callback(null, pic)
    })
  }

  QQ.storeAdditionalData = function (userData, data, callback) {
    async.waterfall([
      // Reset email confirm throttle
      async.apply(db.delete, 'uid:' + userData.uid + ':confirm:email:sent'),
      async.apply(User.getUserField, userData.uid, 'email'),
      function (email, next) {
        // Remove the old email from sorted set reference
        email = email.toLowerCase()
        db.sortedSetRemove('email:uid', email, next)
      },
      async.apply(User.setUserField, userData.uid, 'email', data.email),
      async.apply(User.email.sendValidationEmail, userData.uid, data.email)
    ], callback)
  }
  module.exports = QQ
}(module))
