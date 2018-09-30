<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">[[user:sso.dissociate-confirm-title]]</h3>
		</div>
		<div class="panel-body">
			[[user:sso.dissociate-confirm, {service}]]

			<hr>

			<form method="post">
				<input type="hidden" name="_csrf" value="{config.csrf_token}" />
				<button class="btn btn-danger">[[user:sso.dissociate]]</button>
			</form>
		</div>
	</div>
</div>