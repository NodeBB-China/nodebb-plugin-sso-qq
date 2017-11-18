<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">QQ 单点登录</div>
	<div class="col-sm-10 col-xs-12">
		<div class="alert alert-info" style="background-color:#66CCCC">
				<!--<p class="help-block" style="color:#fff"><b>本版本为测试版本，并不是十分建议使用！</b></p>-->
				<!--<small class="help-block" style="color:#fff">测试版本可能遇到崩溃等问题，请使用 npm i nodebb-plugin-sso-qq-fix@1.0.1 来获取到最近的稳定版本</b></small>-->
				<p class="help-block" style="color:#fff">
					 如果使用碰到问题（崩溃，删除/添加用户错误），请到我们的 <a href="https://github.com/NodeBB-China/nodebb-plugin-sso-qq-fix/issues">issue</a> 中反馈!
				</p>
			</div>
		<div class="alert alert-info">
			<p>
				注册 <strong> <a href="https://connect.qq.com/manage.html#/appcreate/web">QQ互联</a></strong> ,然后把你的APP ID和APP Key复制到下面
				
			</p>
		</div>
		<form class="sso-qq-settings">
			<div class="form-group">
				<label for="id">APP ID</label>
				<input type="text" name="id" title="Client ID" class="form-control" placeholder="APP ID">
			</div>
			<div class="form-group">
				<label for="secret">APP Key</label>
				<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="APP Key" />
			</div>
			<div class="form-group alert alert-warning">
				<label for="callback">你的 NodeBB 授权回调地址</label>
				<input type="text" id="callback" title="Authorization callback URL" class="form-control" value="{callbackURL}" readonly />
				<p class="help-block" style="color:#fff">
					 请将上面的地址填写在你的QQ互联应用中。
				</p>
			</div>
			
		</form>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>

<!--<div class="row">
    <div class="col-lg-9">
        <div class="panel panel-default">
            <div class="panel-heading"><i class="fa fa-qq"></i>QQ Social Authentication</div>
            <div class="panel-body">
                <p>
                       Register a new <strong>QQ Application</strong> via <a href="http://www.qq.com/">qq.com</a> and then paste
                       your application details here. Your callback URL is yourdomain.com/auth/qq/callback
                </p>
                <br />
                <form class="sso-qq">
                    <div class="form-group">
                        <label for="id">Client ID</label>
                        <input type="text" name="id" title="Client ID" class="form-control" placeholder="Client ID"><br />
                    </div>
                    <div class="form-group">
                        <label for="secret">Client Secret</label>
                        <input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="col-lg-3">
        <div class="panel panel-default">
            <div class="panel-heading">QQ Control Panel</div>
            <div class="panel-body">
                <button class="btn btn-primary" id="save">Save Settings</button>
            </div>
        </div>
    </div>
</div>
-->
<!--
<script>
require(['settings'], function(Settings) {
    Settings.load('sso-qq', $('.sso-qq'));

    $('#save').on('click', function() {
			Settings.save('sso-qq', $('.sso-qq-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'sso-qq-saved',
					title: '配置已保存',
					message: '请重载NodeBB以便使插件生效。',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
        });
    });
});
</script>-->

