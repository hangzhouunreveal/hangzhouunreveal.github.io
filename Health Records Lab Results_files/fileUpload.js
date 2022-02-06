var _wizardModal;

if (window.interop) {
    $(function() {
        if ($('.btn.file, .pnc-upload').length) {
            interop.exec('getPermissions');
        }
    });

    $(document).on('shown.bs.modal', function(e) {
        var modal = $(e.target);
        if ($('.btn.file, .pnc-upload', modal).length) {
            interop.exec('getPermissions');
        }
    });   
}

$(document).on('click', '.btn.file, .pnc-upload', function() {
    refreshFileInput();
    var $this = $(this);
    
    if (window.interop && interop.getPermissions()) {
        var p = interop.getPermissions().mediaPicker;
        if (p.shouldShowRationale || p.status === 'Denied') {
            bootbox.dialog({
                title: 'Permission Required',
                message: 'You need to grant permission to device storage in order to choose and existing photo from your library to upload, and for permission to the camera to take a new photo to upload. If you are not prompted for these permissions, check the settings on your device to grant them manually.',
                buttons: {
                    OK: {
                        className: 'btn-primary',
                        callback: function () {
                            $this.prev(':file')[0].click();
                        }
                    },
                    Cancel: {
                        className: 'btn-default'
                    }
                }
            });
        } else {
            $this.prev(':file').click();
        }
    } else {
        $this.prev(':file').click(); 
    }
});

function fetchUploads(type, container) {
    setTimeout(function() {
        container = container || $('body');
        showProgressHUD();
        $.ajax({
            url: config.basePath + "Student/Upload/List?type=" + type,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                $('.uploadContainer.' + type + ' .loading', container).remove();

                for (var i in data) {
                    var upload = data[i];
                    addUpload(upload, container);
                }
                hideProgressHUD();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                hideProgressHUD();
            }
        });
    }, 0);
}

function uploadFiles(event) {
    var e = event || window.event;
    if (!e.target.files.length) return;
    
    var $this = $(this);
    var type = $this.data('type');
    var opt = $this.data('opt');

    if (typeof FormData == 'undefined') {
        alert('Sorry, our file upload module is not supported in this browser. Please try again using Chrome, Safari, Firefox, or IE 10 or higher.');
        return;
    }

    var formData = new FormData();
    $.each(e.target.files, function (k, v) {
        formData.append(k, v);
    });

    formData.append('type', type);
    formData.append('opt', opt);
    var name = e.target.files[0].name;
    var ext = e.target.files[0].type;

    var container = $this.parent();
    var img = container.find('.upload-img');

    showProgressHUD();
    $.validAjax({
        url: config.basePath + "Student/Upload",
        type: 'post',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function (data, textStatus, jqXHR) {
            refreshFileInput(type);
            wizard({ el: $this, documentID: data, type: type, comment: name, ext: ext.substring(ext.lastIndexOf('/') + 1), opt: opt, img: img, container: container });
            hideProgressHUD();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            refreshFileInput();
            hideProgressHUD();
            var message = config.uploadRejected || 'Please make sure your file is less than 4 MB in size.';
            var err = jqXHR.getResponseHeader('X-Error');
            if (err) {
                message = err;
            } else if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                message = jqXHR.responseJSON.error;
            }
            bootbox.alert('Upload Failed: ' + message);
        }
    });
}

function wizardPDF(upload) {
    var src = config.basePath + "Student/Upload/Record/" + upload.documentID + "?type=" + upload.type + "&sequence=" + (upload.sequence || 1) + "&_=" + new Date().getTime();

    _wizardModal = bootbox.dialog({
        closeButton: false,
        title: 'Verify Upload',
        size: 'large',
        message: '<div class="modal-scrollpane outer"><p>Does this image look correct? If it looks wrong for any reason, click <b>Cancel Upload</b> and upload a new image.</p><embed id="' + upload.documentID + '" src="' + src + '" alt="Verify Upload" style="width: 100%; min-height: 600px;" /></div>',
        buttons: {
            'Cancel Upload': {
                className: 'left btn btn-danger',
                callback: function() {
                    $.post(config.basePath + "Student/Upload/Delete/" + upload.documentID, { type: upload.type });
                }
            },
            'Looks Good': {
                className: 'btn btn-success',
                callback: function () {
                    addUpload(upload);
                }
            }
        }
    });
}

function wizard(upload) {
    if (upload.ext == 'pdf') {
        wizardPDF(upload);
        return;
    }
    
    var src = config.basePath + "Student/Upload/Record/" + upload.documentID + "?type=" + upload.type + "&sequence=" + (upload.sequence || 1) + "&_=" + new Date().getTime();
    
    _wizardModal = bootbox.dialog({
        closeButton: false,
        title: 'Verify Upload',
        size: 'large',
        message: '<div class="modal-scrollpane outer"><p>Does this image look correct? If it looks wrong for any reason (i.e., wrong orientation, too bright or dark, needs to be cropped), click <b>Edit Image</b> and use the image editor controls to adjust the image as appropriate.</p><img id="' + upload.documentID + '" class="img img-responsive" src="' + src + '" alt="Verify Upload" /></div>',
        buttons: {
            'Cancel Upload': {
                className: 'left btn btn-danger',
                callback: function() {
                    $.post(config.basePath + "Student/Upload/Delete/" + upload.documentID, { type: upload.type });
                }
            },
            'Edit Image': {
                className: 'btn btn-primary',
                callback:function () {
                    var params = $.param({
                        type: upload.type,
                        id: upload.documentID,
                        name: upload.comment,
                        nocomment: true
                    });
                    var p = getWindowCenter(800, 600);
                    window.open(config.basePath + "Student/Upload/Edit?" + params, "_blank", "toolbar=no,scrollbars=no,resizable=yes,top=" + p.top + ",left=" + p.left +",width=800,height=600");
                    return false;
                }
            },
            'Looks Good': {
                className: 'btn btn-success',
                callback: function () {
                    addUpload(upload);
                }
            }
        }
    });
}

function addUpload(upload, containerEl) {
    // For PncCheckIn...
    if (upload.img && upload.img.length) {
        var src = upload.img.attr('src') || upload.img.data('src');
        upload.img.attr('src', src).show().removeClass('hidden');
        upload.img.prev('.placeholder').hide();
        return;
    }

    containerEl = containerEl || $('body');
    var container = $('.uploadContainer.' + upload.type, containerEl);
    var imgContainer = $("<div class='imgContainer'><span class='comment'/></div>");
    
    var img;
    var src = upload.ext != "pdf" ? 
        config.basePath + "Student/Upload/Record/" + upload.documentID + "?type=" + upload.type + "&sequence=" + (upload.sequence || 1) + "&_=" + new Date().getTime() :
        "/Resources/images/pdf.png";
    
    img = $("<img/>").attr({
        id: upload.documentID,
        "class": "img " + upload.ext,
        src: src
    });

    var comment = upload.comment || upload.documentID;
    $("span.comment", imgContainer).text(comment);

    var a = $("<a/>", { title: comment });
    
    a.click(function (ev) {
       previewDoc(upload); 
    });

    if (upload.count > 1) {
        var c = upload.sequence + " of " + upload.count;
        var sequence = $("<span class='sequence' style='display: none;'>" + c + "</span>");
        imgContainer.append(sequence);
        img.on("load", function () {
            var $this = $(this);
            sequence.css("top", $this.outerHeight() - sequence.height()).show();
        });
        a.attr("title", a.attr("title") + " (" + c + ")");
    }

    a.append(img);
    imgContainer.append(a);
    if (!upload.locked) {
        imgContainer.append($('<div><a style="width: 100%; margin-bottom: 2px;" class="btn btn-xs btn-default remove">Remove</a></div>'));
        $("a.remove", imgContainer).click(function () {
            confirmRemoveUpload(upload.documentID, upload.type);
        });
        if (upload.ext != "pdf") {
            var title = container.is('.nocomment') ? 'Edit' : 'Edit/Comment';
            imgContainer.append('<div><a style="width: 100%; margin-bottom: 2px;" class="btn btn-xs btn-default edit">' + title + '</a></div>');
            $("a.edit", imgContainer).click(function () {
                var params = $.param({
                    type: upload.type,
                    id: upload.documentID,
                    name: upload.comment,
                    nocomment: container.is('.nocomment')
                });
                var p = getWindowCenter(800, 600);
                window.open(config.basePath + "Student/Upload/Edit?" + params, "_blank", "toolbar=no,scrollbars=no,resizable=yes,top=" + p.top + ",left=" + p.left +",width=800,height=600");
            });
        }
    }

    if (upload.opt === 'single') container.empty();
    container.append(imgContainer);
}

function imageSavedCallback(id) {
    var img = $('img#' + id);
    var oldSrc = img.attr('src');
    oldSrc = oldSrc.substring(0, oldSrc.indexOf('&_='));

    showProgressHUD();
    img[0].onload = hideProgressHUD;
    img.attr('src', oldSrc + '&_=' + new Date().getTime() + '&ext=.png');
}

function refreshFileInput(type) {
    $(":file").each(function () {
        var $this = $(this);
        var clone = $this.clone();
        clone.val(null);
        $this.after(clone).remove();
        clone.change(uploadFiles);
    });
}

function confirmRemoveUpload(id, type) {
    bootbox.confirm('Are you sure you want to remove this file?', function(result) {
        if (result) {
            $.post(config.basePath + "Student/Upload/Delete/" + id, { type: type });
            $("#" + id).closest(".imgContainer").remove();
        }
    });
}

var _docModal;
function previewDoc(upload) {
    showProgressHUD();
    var params = { id: upload.documentID, sequenceID: upload.sequence || 1, preview: true, type: upload.type };
    var url = upload.url || (upload.locked ? 'Mvc/PatientDocuments/Document' : 'Student/Upload/Record');
    $.get(config.basePath + url, params, function(html) {
        hideProgressHUD();
        if (_docModal) _docModal.modal('hide');
        _docModal = bootbox.dialog({
            size: 'large',
            title: upload.comment || 'Preview',
            message: html
        });
    });
}