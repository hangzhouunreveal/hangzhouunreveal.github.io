var builtIn = {
    covid19: function(mode) {
        if (mode !== 'Test' && mode !== 'Vaccine') mode = '';
        showProgressHUD();
        $.get(config.basePath + 'Mvc/BuiltIn/Covid19' + mode, function(html) {
            hideProgressHUD();
            var modal = bootbox.dialog({
                title: 'COVID 19',
                size: 'large',
                message: html,
                buttons: {
                    Done: {
                        className: 'btn-primary',
                        callback: function() {
                            var form = $('#editForm');
                            if (!form.valid()) return false;
                            
                            var action = form.attr('action');
                            var payload = form.serialize();

                            showProgressHUD();
                            $.post(config.basePath + action, payload, function(msg) {
                                hideProgressHUD();
                                modal.modal('hide');
                                if (msg) bootbox.alert(msg);
                            });
                            
                            return false;
                        }
                    }
                }
            }).on('shown.bs.modal', function() {
                $('[data-verified]', modal).each(function() {
                    var $this = $(this);
                    if ($this.data('verified')) {
                        $(':input, select', $this).prop('disabled', true);
                        var panel = $this.closest('.panel');
                        $('.radioclear', panel).hide();
                    }
                });

                var form = $('#editForm', modal);
                $('.date', form).addClass('ptdob notfuture').attr('placeholder', config.dateFormatDisplay);
                form.validate();

                $('.uploadContainer', modal).each(function () {
                    var type = $(this).data('type');
                    if (type) fetchUploads(type, modal);
                });

                builtIn._fetchExistingUploads();
            });
        });
    },
    
    deleteImmunization: function(o) {
        var _callback  = o.callback;
        delete o.callback;
        
        ocomm.confirm({
            message: 'Are you sure you want to delete this immunization?',
            callback: function(yes) {
                if (!yes) return;
                
                showProgressHUD();
                $.post('Mvc/Immunization/Delete', antiForgeryToken(o), function(res) {
                    hideProgressHUD();
                    if (_callback) _callback(res);
                });
            }
        });
    },

    editImmunization: function(o) {
        var _callback  = o.callback;
        delete o.callback;
        
        showProgressHUD();
        $.get('/Mvc/Immunization/Edit', o, function(html) {
            hideProgressHUD();
            var modal = bootbox.dialog({
                title: o.title || (o.id ? 'Edit Immunization' : 'Add Immunization'),
                message: html,
                size: 'large',
                buttons: {
                    Save: {
                        className: 'btn-primary',
                        callback: function() {
                            var form = $('form', modal);
                            if (!form.valid()) return false;

                            var params = form.serializeObject();
                            showProgressHUD();
                            $.post('/Mvc/Immunization/Edit', params, function(res) {
                                hideProgressHUD();
                                modal.modal('hide');
                                toastr.success('Immunization saved successfully');
                                if (_callback) _callback(res);
                            });

                            return false;
                        }
                    },
                    Cancel: {
                        className: 'btn-default'
                    }
                }
            }).on('shown.bs.modal', function() {
                var form = $('form', modal);
                form.validate();
            });
        });
    },

    _fetchExistingUploads: function (container) {
        $('.dlform').each(function () {
            var $this = $(this);
            var id = $this.data('formid');
            fetchUploads('form-' + id, container);
    
            if ($('.imgContainer', $this).length) {
                $('.additionalUploads', $this).show();
            }
        })
    }
};

var wehealth = {
    getCode: function(testID) {
        var params = antiForgeryToken({ testID: testID });
        showProgressHUD();
        $.post(config.basePath + 'Student/Results/GetCode', params,  function (res) {
            if (res && res.code) {
                var msg = 'Your code is: <strong style="font-size: 1.4em; font-family: courier, serif;">' + res.code + '</strong>';
                bootbox.alert(msg);
            } else if (res) {
                bootbox.alert(res);
            } else {
                bootbox.alert('An unexpected error has occurred.');
            }
        }).fail(function (res) {
            var json = JSON.parse(res.responseText);
            if (json && json.error) {
                bootbox.alert(json.error);
            }
        }).always(function () {
            hideProgressHUD();
        });
    }
};

$(document).on('click', '.addnew', function () {
    var panel = $(this).closest('.panel');
    $(':text, select, :input:hidden', panel).val('').prop('disabled', false).addClass('required');
    $(':radio', panel).prop('checked', false).prop('disabled', false).addClass('required');
    $('.radioclear', panel).show();
    $('#IsAddNew').val('True');
    $('#editForm').data('validator', null).validate();
});

$(document).on('click', 'button.radioclear', function() {
    $(this).next('div').find(':radio').each(function() {
        $(this).prop('checked', false);
    });
});

$(document).on('click', '.btn.edit.immunization', function() {
    var $this = $(this);
    var o = {
        id: $this.data('pid'),
        isCovid19: $this.is('.covid19'),
        complianceCode: $(this).data('compliancecode'),
        callback: function(html) {
            var modal = $this.closest('.modal');
            $('.immunization.history', modal).replaceWith(html);
        }
    };
    builtIn.editImmunization(o);
});

$(document).on('click', '.btn.delete.immunization', function() {
    var $this = $(this);
    var o = {
        id: $this.data('pid'),
        isCovid19: $this.is('.covid19'),
        complianceCode: $(this).data('compliancecode'),
        callback: function(html) {
            var modal = $this.closest('.modal');
            $('.immunization.history', modal).replaceWith(html);
        }
    };
    builtIn.deleteImmunization(o);
});