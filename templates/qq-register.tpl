<div class="row register">
	<div class="col-md-12">
		<div class="panel-heading" >
				<h3 class="panel-title"><i class="fa fa-qq"></i> 完善您的账户信息</h3>
		</div>
		<div class="panel-body">
			<div class="alert alert-danger hidden" id="register-error-notify" >
				<strong>注册错误</strong>
				<p></p>
			</div>
			<div class="alert alert-info">
				<strong>在正式使用社区服务前，请您完善您的账户信息！</strong>
			</div>
			<form  class="form-horizontal" role="form" action="/sso-qq/register" method="post">
				<div class="form-group">
					<label for="email" class="col-lg-4 control-label">电子邮箱地址</label>
					<div class="col-lg-8">
						<input class="form-control" type="email" placeholder="输入电子邮箱地址" name="email" id="email" autocorrect="off" autocapitalize="off" />
						<span class="register-feedback" id="email-notify"></span>
						<span class="help-block">默认情况下，您的电子邮箱不会公开。</span>
					</div>
				</div>
				<div class="form-group">
					<label for="username" class="col-lg-4 control-label">用户名</label>
					<div class="col-lg-8">
						<input class="form-control" type="text" placeholder="输入用户名" name="username" id="username" autocorrect="off" autocapitalize="off" autocomplete="off" />
						<span class="register-feedback" id="username-notify"></span>
						<span class="help-block">全局唯一的用户名，长度 2 到 16 个字。其他人可以使用 @<span id='yourUsername'>用户名</span> 提及您。</span>
					</div>
				</div>
				<div class="form-group">
					<label for="password" class="col-lg-4 control-label">密码</label>
					<div class="col-lg-8">
						<input class="form-control" type="password" placeholder="输入密码" name="password" id="password" />
						<span class="register-feedback" id="password-notify"></span>
						<span class="help-block">您的密码长度必须不少于 6 个字。</span>
					</div>
				</div>
				<div class="form-group">
					<div class="col-lg-offset-4 col-lg-8">
						<button class="btn btn-primary btn-lg btn-block" id="register" type="submit">立即注册</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>