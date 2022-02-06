﻿$.support.touch = 'ontouchend' in document;

$(function () {
    $('a#PrintPage, a[href$="print.aspx"], a[href$="Print.aspx"]').css('color', $('a:first').css('color'));

    $('.sidebar').css('background-color', $('body').css('background-color'));
    $('.navbar-header button.collapsed .fa-user').css('color', $('.icon-bar:first').css('background-color'));

    $('#side-toggle, #overlay').click(function () {
        var sidebar = $('#sidebar');
        var overlay = $('#overlay');
        sidebar.toggle();
        $(window).resize();
        overlay.toggle(sidebar.is(':visible'));
    });

    //$('.navbar-brand img').parent().css('padding', '0px');

    // override jquery validate plugin defaults
    if ($.validator) {
        $.validator.setDefaults({
            errorElement: "span",
            errorClass: "help-block error",
            invalidHandler: function (form, validator) {
                if (!validator.numberOfInvalids()) return;
                var el = $(validator.errorList[0].element);
                el[0].scrollIntoView();
                el.focus();
            },
            highlight: function (element, errorClass, validClass) {
                $(element).addClass('error').closest('.form-group').addClass('has-error');
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).removeClass('error').closest('.form-group').removeClass('has-error');
            },
            errorPlacement: function (error, element) {
                if (element.parent('.input-group').length || (element.is(':checkbox') || element.is(':radio') && !element.closest('.form-group').length)) {
                    error.insertAfter(element.parent());
                } else {
                    var g = element.closest('.form-group');
                    if (g.length) element.closest('.form-group').append(error);
                    else element.after(error);
                }
            }
        });

        // Custom validators...

        $.validator.addMethod("startdate", function (startDateStr, element) {
            var endDateStr = $(".enddate").val();
            if (!startDateStr || !endDateStr) return true;

            var startDate = moment(startDateStr, "M/D/YYYY h:mm A");
            var endDate = moment(endDateStr, "M/D/YYYY h:mm A");
            return startDate <= endDate;
        }, "Must be on/before end date");

        $.validator.addMethod("enddate", function (endDateStr, element) {
            var startDateStr = $(".startdate").val();
            if (!endDateStr || !startDateStr) return true;

            var startDate = moment(startDateStr, "M/D/YYYY h:mm A");
            var endDate = moment(endDateStr, "M/D/YYYY h:mm A");
            return startDate <= endDate;
        }, "Must be on/after start date");
    }

    var _handleResize = function() {
        var sidebar = $('#sidebar');
        if (!sidebar.length) return;
        
        if (sidebar.is(':visible')) sidebar.attr('aria-hidden', 'false');
        else sidebar.attr('aria-hidden', 'true');
    };
    
    $(window).resize(debounce(_handleResize, 50)).resize();
});

$(document).on('shown.bs.modal', function (e) {
    var modal = $(e.target);
    $(':text', modal).attr('autocomplete', 'off');

    if (modal.is('.bootbox-prompt')) {
        var ok = $('.modal-footer button[data-bb-handler=confirm]', modal);
        var cancel = $('.modal-footer button[data-bb-handler=cancel]', modal);
        cancel.detach();
        ok.after(cancel);

        ok.show();
        cancel.show();
    }
});

$(document).on('click', '#homekitVideo', function() {
    var title = $(this).text();
    $.get(config.basePath + 'Mvc/HomeKit/QuickLinkContent', function(html) {
        if (!html) {
            bootbox.alert('No content available.');
            return;
        }
        
        bootbox.dialog({
            title: title,
            size: 'large',
            message: html,
            buttons: {
                OK: {}
            }
        });
    });
});