window.addEvent('domready', function() {
	var Req = new gx.zeyos.Request({'service': SELFNS + '.print'});
	
	var hdnLanguage = $('hdnLanguage');
	var hdnOptions = $('hdnOptions');
	var hdnSendMail = $('hdnSendMail');
	var hdnMailTemplate = $('hdnMailTemplate');
	var txtIntro = $('txtIntro');
	var txtOutro = $('txtOutro');
	var groupIntro = new gx.zeyos.Groupbox(txtIntro, {'title': 'Intro'});
	var groupOutro = new gx.zeyos.Groupbox(txtOutro, {'title': 'Outro'});
	groupOutro._display.bar.addClass('m_t-10');
	
	// Templates
	var currentTemplate = '';
	var txtNewName = $('txtNewName');
	var divInsert = $('divInsert');
	var divNew = $('divNew');
	var chkDefault = new gx.zeyos.Toggle('chkDefault', {'value': false});
	var mnuTemplate = new gx.zeyos.Dropdown($('mnuTemplate'), {
		'label': _('dialog.template.template'),
		'resettable': false
	});
	mnuTemplate.addEvent('change', function(tID, text) {
		if (tID != null) {
			currentTemplate = text;
			Req.get('template/load/'+tID, {}, function(res) {
				 txtIntro.set('value', res.intro);
				 txtOutro.set('value', res.outro);
			});
		}
	});
	function loadTemplateList(callback) {
		Req.get('template/list/'+TYPE, {}, function(res) {
			var list = {};
			res.each(function(template) {
				var icoRemove = __({
					'tag': 'span',
					'html': '✘',
					'styles': {
						'color': '#ef1010'
					},
					'class': 'm_r-5'
				});
				list[template.ID] = {
					'onClick': function(evt) {
						if (evt.target == icoRemove && confirm(_('dialog.template.confirm', {'name': template.name}))) {
							Req.post('template/remove/'+template.ID, {}, function(res) {
								loadTemplateList();
							});
						} else {
							mnuTemplate.selectItem(template.ID, template.name);
						}
						
						evt.stop();
					},
					'text': template.name,
					'html': __({'tag': 'span', 'children': {
						'remove': icoRemove,
						'html': template.name
					}})
				};
			});
			mnuTemplate.setItems(list);
			
			if (callback != null)
				callback();
		});
	}
	loadTemplateList(function() {
		if (TEMP != null && TEMP.name != null)
			mnuTemplate.selectItem(TEMP.ID, TEMP.name);
	});
	
	
	// Display language menu
	var mnuLanguage = new gx.zeyos.Dropdown($('mnuLanguage'), {
		'label': _('entity.language.singular'),
		'resettable': false
	});
	Req.get('languages/'+ENTITY+'/'+ID, {}, function(res) {
		mnuLanguage.setItems(res.list);
		if (res.current != null && res.current.id != null)
			mnuLanguage.selectItem(res.current.id, res.current.label);
	});
	
	// Display print options
	var options = {};
	var sectOptions = $('sectOptions');
	Req.get('options/'+ENTITY+'/'+ID, {}, function(res) {
		if (Object.getLength(res)) {
			var groupOptions = new gx.zeyos.Groupbox(sectOptions, {'title': 'Options'});
			groupOptions._display.bar.addClass('m_t-10');
			for (var i in res) {
				switch (res[i]['type']) {
					case 'checkbox':
						options[i] = new gx.zeyos.Toggle(null, {'on': res[i]['value'] == null ? false : !(!res[i]['value'] || res[i]['value'] == "0" || res[i]['value'].toLowerCase() == "false")});
						options[i].get = function(t) {
							return this.getState();
						}
						sectOptions.adopt(__({'class': 'm_t-5', 'children': [options[i].toElement(), new Element('label', {'class': 'm_l-5 fb', 'html': res[i]['label']}), new Element('br')]}));
						break;
					case 'text':
						options[i] = new Element('input', {'type': 'text', 'value': res[i]['value'] == null ? '' : res[i]['value']});
						sectOptions.adopt([new Element('p', {'class': '', 'html': res[i]['label']}), options[i], new Element('br')]);
						break;
					case 'textarea':
						options[i] = new Element('textarea', {'value': res[i]['value'] == null ? '' : res[i]['value']});
						sectOptions.adopt([new Element('p', {'class': '', 'html': res[i]['label']}), options[i], new Element('br')]);
						break;
					case 'select':
						options[i] = new Element('select');
						if (options[i].options != null) {
							for (var o in res[i].options)
								if (res[i].options.hasOwnProperty(o))
									options[i].adopt(new Element('option', {'value': o, 'html': res[i].options[o]}));
						}
						if (res[i]['value'] != null)
							options[i].set('value', res[i]['value']);
						sectOptions.adopt([new Element('p', {'class': 'm_t-5', 'html': res[i]['label']}), options[i], new Element('br')]);
						break;
				}
			}
		} else {
			sectOptions.destroy();
		}
	});
	function getOptions() {
		var res = {};
		for (var i in options)
			res[i] = options[i].get('value');
		return JSON.encode(res);
	}
	
	var chkSendMail = new gx.zeyos.Toggle('chkSendMail', {'on': !!PRESETS.sendMail });
	var mnuMailTemplate = new gx.zeyos.Dropdown($('mnuMailTemplate'), {
		'label': _('dialog.email_template'),
		'resettable': true,
		'compact': true,
		'width': '150px',
		'upside': true
	});
	Req.get('email/templates/'+ENTITY+'/'+ID, {}, function(res) {
		mnuMailTemplate.setItems(res.list);
		if (res.current != null && res.current.id != null)
			mnuMailTemplate.selectItem(res.current.id, res.current.label);
		else if (PRESETS.mailTemplate)
			mnuMailTemplate.selectItem(PRESETS.mailTemplate.id, PRESETS.mailTemplate.label);
	});
	
	var chkAttach = new gx.zeyos.Toggle('chkAttach', {'value': false});
	/*
	if (TYPE == 2 || TYPE == 3)
		chkAttach.setChecked();
	*/
	
	$('btnSaveTemplate').addEvent('click', function() {
		divInsert.setStyle('display', 'none');
		divNew.setStyle('display', 'block');
		txtNewName.set('value', currentTemplate);
		txtNewName.focus();
	});
	$('btnNewCancel').addEvent('click', function() {
		divInsert.setStyle('display', 'block');
		divNew.setStyle('display', 'none');
	});
	$('btnNewSave').addEvent('click', function() {
		Req.post('template/save/'+TYPE, {
			'intro':   txtIntro.get('value'),
			'outro':   txtOutro.get('value'),
			'name' :   txtNewName.get('value'),
			'default': chkDefault.getState() ? 1 : 0,
			'lang' :   mnuLanguage.getValue()
		}, function(res) {
			ZeyOSApi.showMsg('transactions.billing', 'PDF Druckvorlage', _('message.update', {'model': _('dialog.template.template')}));
			loadTemplateList();
			divInsert.setStyle('display', 'block');
			divNew.setStyle('display', 'none');
		});
	});
	$('btnSave').addEvent('click', function() {
		Req.post('save/'+ENTITY+'/'+ID, {
			'intro'  : txtIntro.get('value'),
			'outro'  : txtOutro.get('value'),
			'lang'   :   mnuLanguage.getValue(),
			'options': getOptions()
		}, function(res) {
			ZeyOSApi.showMsg('transactions.billing', 'PDF Druckvorlage', _('message.update', {'model': _('dialog.printout')}));
		});
	});
	/*
	$('btnClose').addEvent('click', function() {
		ZeyOSApi.hidePop();
	});
	*/
	$('btnPrint').addEvent('click', function() {
		hdnOptions.set('value', getOptions());
		hdnAttach.set('value', chkAttach.getState() ? 1 : 0);
		hdnSendMail.set('value', chkSendMail.getState() ? 1 : 0);
		hdnMailTemplate.set('value', mnuMailTemplate.getValue());
		hdnLanguage.set('value', mnuLanguage.getValue());
	});
});