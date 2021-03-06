Ti.API.info(Ti.App.Properties.getString("cookie_session") + " l:" + Ti.App.Properties.getString("loggedIn"));
var blob = null;
var service = null;
var data = [];
var aspects = null;
var userinfo = null;

var content = Alloy.createWidget("list", "widget", {
    getStream : getStream, click : true, showImage : showImage
});
$.content.add(content.getView());

if (!Ti.App.Properties.hasProperty("token")) {
    Ti.App.Properties.setString("token", "");
}

if (!Ti.App.Properties.hasProperty("invitelink")) {
    Ti.App.Properties.setString("invitelink", "");
}

if (!Ti.App.Properties.hasProperty("lastNotification")) {
    Ti.App.Properties.setString("lastNotification", "0");
}

if (!Ti.App.Properties.hasProperty("stream") || Ti.App.Properties.getString("stream") == "") {
    Ti.App.Properties.setString("stream", "stream");
}

if (!Ti.App.Properties.hasProperty("username")) {
    Ti.App.Properties.setString("username", "");
}

if (!Ti.App.Properties.hasProperty("aspect")) {
    Ti.App.Properties.setString("aspect", "public");
}
if (!Ti.App.Properties.hasProperty("aspectID")) {
    Ti.App.Properties.setString("aspectID", "public");
}

$.btn_aspect.title = Ti.App.Properties.getString("aspect");

if (!Ti.App.Properties.hasProperty("pod")) {
    Ti.App.Properties.setString("pod", "https://joindiaspora.com");
}

if (!Ti.App.Properties.hasProperty("cookie_session"))
    Ti.App.Properties.setString("cookie_session", "");

if (!Ti.App.Properties.hasProperty("cookie_user"))
    Ti.App.Properties.setString("cookie_user", "");

$.index.open();

if (Ti.App.Properties.getString("cookie_session") == "" || Ti.App.Properties.getBool("loggedIn") == false) {
    var obj = Alloy.createController("login", {
        getStream : getStream, getToken : getToken, getUserInfo : getUserInfo
    }).getView();
    obj.open();
}

function onToken(e) {
    // extract token
    //
    var m = /.*authenticity_token.*value=\"(.*)\"/;
    var res = String(e).match(m);
    Ti.App.Properties.setString("token", res[1]);

}

function onTokenError(e) {
    // extract token
    //
    Ti.API.error("no token");
}

function getToken() {
    // get new token after login

    Ti.API.info("get login token");

    require("/api").createAPI({
        type : "GET", url : "/stream", success : onToken, error : onTokenError, noJSON : true
    });
}

Ti.App.addEventListener('checkNotifications', function(data) {
    checkNotification();
});

function getStream() {
    // get stream
    //
    $.waiting.message = L("getStream");
    $.waiting.show();

    require("/api").createAPI({
        type : "GET", url : "/" + Ti.App.Properties.getString("stream"), success : onStream, token : true, error : onStreamError
    });
}

function onClickOptionAspects(e) {
    $.view_aspects.visible = false;
    Ti.App.Properties.setString("aspectID", e.source.id);
    Ti.App.Properties.setString("aspect", e.source.title);
    $.btn_aspect.title = e.source.title;
}

function onClickAspects(e) {
    $.view_aspects.visible = true;
}

function onStream(e) {
    data = [];
    for (var i = 0; i < e.length; ++i) {

        var txt = String(e[i].text).replace(/<(?:.|\n)*?>/gm, '');
        var myFav = false;
        var favID = 0;
        var photo = "";
        var photoBig = "";

        if (e[i].interactions.likes.length > 0) {
            myFav = true;
            favID = e[i].interactions.likes[0].id;
        }

        if (e[i].photos.length > 0) {
            photo = e[i].photos[0].sizes.small;
            photoBig = e[i].photos[0].sizes.large;
        }

        data.push({
            photo : photo, photoBig : photoBig, date : Alloy.Globals.formatDate(e[i].created_at), myFav : myFav, favID : favID, isPublic : e[i]["public"], author : e[i].author.name, comment_count : String(e[i].interactions.comments_count), text : txt, icon : e[i].author.avatar.small, id : e[i].id, like_count : String(e[i].interactions.likes_count)
        });
        txt = null;
        myFav = null;
        favID = null;
        photo = null;
        photoBig = null;
    }

    content.setData(data);
    $.waiting.hide();
}

function onStreamError(e) {
    $.waiting.hide();
}

function onClickStreamOption(e) {
    var txt = "stream";
    if (e.source.optionID == 0) {
        txt = "stream";
        $.lbl_stream.text = L("txt_stream");
    } else if (e.source.optionID == 1) {
        txt = "activity";
        $.lbl_stream.text = L("txt_activity");
    } else if (e.source.optionID == 2) {
        txt = "mentions";
        $.lbl_stream.text = L("txt_mentions");
    } else if (e.source.optionID == 3) {
        txt = "followed_tags";
        $.lbl_stream.text = L("txt_followedtags");
    }

    Ti.App.Properties.setString("stream", txt);

    // get new stuff
    getStream();
    txt = null;

    // hide menu
    onClickStream(null);
}

function onClickStream(e) {

    var ani = Ti.UI.createAnimation();
    if ($.view_menu_stream.left > -200) {
        // hide menu
        ani.left = -200;
    } else {
        // show menu
        ani.left = 0;
    }
    ani.duration = 200;
    $.view_menu_stream.animate(ani);
    ani = null;
}

function onLogout(e) {
    Ti.App.Properties.setString("cookie_session", "");
    Ti.App.Properties.setString("token", "");
    Ti.App.Properties.setBool("loggedIn", false);
    $.waiting.hide();
    $.text.value = "";
    var obj = Alloy.createController("login", {
        getStream : getStream, getToken : getToken, getUserInfo : getUserInfo
    }).getView();
    obj.open();

    blob = null;
    $.btn_photo.backgroundColor = "#373937";
}

function onLogoutError(e) {
    $.waiting.hide();
    Ti.App.Properties.setString("cookie_session", "");
    Ti.App.Properties.setString("token", "");
    Ti.App.Properties.setBool("loggedIn", false);
    $.text.value = "";
    var obj = Alloy.createController("login", {
        getStream : getStream, getToken : getToken, getUserInfo : getUserInfo
    }).getView();
    obj.open();
}

function onClickLogout(e) {
    // logout
    $.waiting.show();

    deleteService();

    require("/api").createAPI({
        type : "POST", url : "/users/sign_out", success : onLogout, error : onLogoutError, parameter : {
            "_method" : "delete", "authenticity_token" : Ti.App.Properties.getString("token")
        }
    });
}

function onNotification(e) {
    // show notification
    var count = 0;
    var lastSaved = new Date(Ti.App.Properties.getString("lastNotification"));
    var last = 0;

    Ti.API.info("last: " + lastSaved);
    for ( i = 0; i < e.length; ++i) {
        for (var obj in e[i]) {
            // check for unread stuff
            if (e[i][obj].unread == true) {

                if (new Date(e[i][obj].created_at) > lastSaved) {
                    // only count new stuff since last check - so we can keep the status in web

                    if (new Date(e[i][obj].created_at) > new Date(last))
                        last = e[i][obj].created_at;
                    count++;
                }
            }

        }
    }
    if (last == 0) {
        last = lastSaved;
    }
    Ti.API.info("save: " + last);
    Ti.App.Properties.setString("lastNotification", last);

    if (count > 0) {
        // create notification
        var intent = Ti.Android.createIntent({
            flags : Ti.Android.FLAG_ACTIVITY_CLEAR_TOP | Ti.Android.FLAG_ACTIVITY_NEW_TASK, className : 'com.miga.pusteblume.PusteblumeActivity'
        });
        intent.addCategory(Ti.Android.CATEGORY_LAUNCHER);

        var pending = Ti.Android.createPendingIntent({
            intent : intent, flags : Ti.Android.FLAG_UPDATE_CURRENT
        });

        var notification = Ti.Android.createNotification({
            icon : Ti.App.Android.R.drawable.appicon, contentTitle : 'Pusteplume', contentText : count + " " + L("somethingNew"), contentIntent : pending, defaults : Titanium.Android.DEFAULT_ALL, flags : Titanium.Android.ACTION_DEFAULT | Titanium.Android.FLAG_AUTO_CANCEL | Titanium.Android.FLAG_SHOW_LIGHTS
        });
        // Send the notification.
        Ti.Android.NotificationManager.notify(1, notification);
    }
}

function onNotificationError(e) {
    // do nothing
}

function checkNotification(e) {
    // check if there is something new
    Ti.API.info("check notifications");
    require("/api").createAPI({
        type : "GET", url : "/notifications", success : onNotification, error : onNotificationError, parameter : {
        }
    });
}

function onSubmit(e) {
    $.text.value = "";
    $.text.blur();
    blob = null;
    $.btn_photo.backgroundColor = "#373937";
    getStream();
}

function onSubmitError(e) {
    //getStream();
    $.waiting.hide();
}

function onClickCancel(e) {
    $.view_post.visible = false;
}

function onSubmitPhoto(e) {
    blob = null;
    $.text.blur();
    $.btn_photo.backgroundColor = "#373937";
    // photo uploaded now submit post

    onClickSubmit({
        photoID : e.data.photo.id
    });
}

function onSubmitPhotoError(e) {
    $.waiting.hide();
}

function onClickSubmit(e) {
    // post message
    //
    $.waiting.message = L("posting") + "...";
    $.waiting.show();
    $.text.blur();
    if (blob != null) {
        require("/api").createAPI({
            type : "POST", timeout : 20000, isBinary : true, token : true, filename : blob.file.name, url : "/photos?photo[pending]=true&photo[aspect_ids][0]=" + Ti.App.Properties.getString("aspectID") + "&set_profile_image=&qqfile=" + blob.file.name, success : onSubmitPhoto, error : onSubmitPhotoError, parameter : {
                data : blob
            }
        });
    } else {

        match = /\n/ig;
        Ti.API.info($.text.value);
        txt = String($.text.value).replace(match, "\\r\\n");

        Ti.API.info(txt);
        if (e.photoID == null) {
            require("/api").createAPI({
                type : "POST", postJSON : true, token : true, url : "/status_messages", success : onSubmit, error : onSubmitError, parameter : {
                    "location_coords" : "", "aspect_ids" : Ti.App.Properties.getString("aspectID"), "status_message" : {
                        "text" : txt
                    }
                }
            });
        } else {
            require("/api").createAPI({
                type : "POST", postJSON : true, token : true, url : "/status_messages", success : onSubmit, error : onSubmitError, parameter : {
                    "location_coords" : "", "aspect_ids" : Ti.App.Properties.getString("aspectID"), "status_message" : {
                        "text" : txt
                    }, "photos" : String(e.photoID)
                }
            });
        }
    }
}

function onResume(e) {
    if (Ti.App.Properties.getString("cookie_session") != "") {
        getStream();
        getUserInfo();
    }
}

if (Ti.App.Properties.getString("cookie_session") != "" && Ti.App.Properties.getBool("loggedIn")) {
    getStream();
    getUserInfo();
}

function onSelectPhoto(e) {
    blob = e.media;
    $.btn_photo.backgroundColor = "#5597C9";
}

function onClickPhoto(e) {
    if (blob == null) {
        Ti.Media.openPhotoGallery({
            success : onSelectPhoto, mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
        });
    } else {
        blob = null;
        $.btn_photo.backgroundColor = "#373937";
    }
}

function onClickWrite(e) {
    if ($.content.bottom <= 10) {
        $.content.bottom = 120;
        $.view_post.visible = true;
    } else {
        $.content.bottom = 0;
        $.view_post.visible = false;
    }

}

function onRefresh(e) {
    getStream();
    //checkNotification();
    Ti.App.Properties.setString("lastNotification", "0");
}

function showImage(url) {
    $.view_photo.visible = true;
    $.img_big.image = url;
}

function onClickImage(e) {
    $.view_photo.visible = false;
    $.img_big.url = null;
}

function onUserinfo(e) {
    res = String(e).match(/gon.user=(.[^}][^;]+});/i);
    userinfo = JSON.parse(res[1]);
    aspects = userinfo.aspects;
    res = null;

    // set user stuff
    $.img_me.image = userinfo.avatar.small;
    $.lbl_me.text = userinfo.name;

    // set aspects
    $.view_aspects.removeAllChildren();

    var btn = Ti.UI.createButton({
        title : "public", id : "public", width : 200, top : 5
    });
    btn.addEventListener("click", onClickOptionAspects);
    $.view_aspects.add(btn);

    for (var i = 0; i < aspects.length; ++i) {

        btn = Ti.UI.createButton({
            title : aspects[i].name, id : aspects[i].id, width : 200, bottom : 5
        });
        btn.addEventListener("click", onClickOptionAspects);
        $.view_aspects.add(btn);
    }

}

function onUserinfoError(e) {

}

function getUserInfo() {
    //
    Ti.API.info("get user info");
    require("/api").createAPI({
        type : "GET", url : "/bookmarklet", success : onUserinfo, error : onUserinfoError, noJSON : true
    });
}

function sendMail() {
    var emailDialog = Ti.UI.createEmailDialog();
    emailDialog.subject = "Hello from Diaspora";
    emailDialog.messageBody = L("txt_invite_email") + " " + Ti.App.Properties.getString("invitelink");
    emailDialog.open();
}

function onInvite(e) {
    var m = /id=\"invite_code\".*value=\"(.*)\".[^>]/i;
    var res = String(e).match(m);

    Ti.App.Properties.setString("invitelink", res[1]);
    sendMail();
}

function onInviteError(e) {
}

function onClickInvite(e) {
    if (Ti.App.Properties.getString("invitelink") == "") {
        require("/api").createAPI({
            type : "GET", url : "/users/invitations", success : onInvite, error : onInviteError, noJSON : true
        });
    } else {
        // send mail
        sendMail();
    }

    // https://joindiaspora.com/users/invitations
}

function onClickSettings(e){
    Alloy.createController("settings");
}


// events
//
Ti.App.addEventListener("resume", onResume);
$.btn_aspect.addEventListener("click", onClickAspects);
$.view_stream.addEventListener("click", onClickStream);
$.lbl_option1.addEventListener("click", onClickStreamOption);
$.lbl_option2.addEventListener("click", onClickStreamOption);
$.lbl_option3.addEventListener("click", onClickStreamOption);
$.lbl_option4.addEventListener("click", onClickStreamOption);
$.btn_logout.addEventListener("click", onClickLogout);
$.btn_submit.addEventListener("click", onClickSubmit);
$.btn_photo.addEventListener("click", onClickPhoto);
$.btn_write.addEventListener("click", onClickWrite);
$.btn_refresh.addEventListener("click", onRefresh);
$.img_big.addEventListener("click", onClickImage);
$.btn_close.addEventListener("click", onClickImage);
$.lbl_invite.addEventListener("click", onClickInvite);
$.btn_settings.addEventListener("click",onClickSettings);
