var args = arguments[0] || {};
var content = Alloy.createWidget("list", "widget", {
    getStream : getStream, click : false
});
var favID = args.data.favID || 0;
$.content.add(content.getView());

var data = [];
var refresh = args.refresh || null;

// set text

$.lbl_post_text.html = Alloy.Globals.replaceText(args.data.text);
$.img_post_icon.image = args.data.icon;
$.lbl_post_author.text = args.data.author;
//$.lbl_comments.text = args.data.comment_count;
//$.lbl_likes.text = args.data.like_count;
$.btn_like.backgroundImage = (args.data.myFav) ? "/images/heart_full.png" : "/images/heart_empty.png";
$.btn_like.liked = args.data.myFav;

function getStream() {
    // get comments from server
    //
    $.waiting.message = L("getCommets");
    $.waiting.show();

    require("/api").createAPI({
        type : "GET", url : "/posts/" + args.id + "/comments", success : onComments, error : onCommentsError
    });
}

function onCommentsError(e) {
    $.waiting.hide();
}

function onComments(e) {
    $.waiting.hide();
    var mainData = [];

    //$.lbl_comments.text = e.length;

    for (var i = 0; i < e.length; ++i) {

        var txt = String(e[i].text).replace(/<(?:.|\n)*?>/gm, '');

        mainData.push({
            type : "comments", author : e[i].author.name, text : txt, icon : e[i].author.avatar.small, date : Alloy.Globals.formatDate(e[i].created_at), image : ""
        });
    }
    content.setData(mainData);
    mainData = null;
}

function onClickClose(e) {
    $.comments.close();
}

function onPostComment(e) {
    $.txt_comment.value = "";
    $.waiting.hide();
    getStream();
}

function onPostCommentError(e) {
    $.waiting.hide();
}

function onPostLike(e) {
    $.waiting.hide();
    if (!$.btn_like.liked) {
        favID = e.id;
        //$.lbl_likes.text = (parseInt($.lbl_likes.text) + 1);
        $.btn_like.backgroundImage = "/images/heart_full.png";
        $.btn_like.liked = true;
    } else {
        //$.lbl_likes.text = (parseInt($.lbl_likes.text) - 1);
        $.btn_like.backgroundImage = "/images/heart_empty.png";
        $.btn_like.liked = false;
    }
}

function onPostLikeError(e) {
    $.waiting.hide();
}

function onClickPost(e) {
    $.waiting.show();
    require("/api").createAPI({
        type : "POST", url : "/posts/" + args.id + "/comments", token : true, success : onPostComment, error : onPostCommentError, parameter : {
            "text" : $.txt_comment.value
        }
    });

}

function onClickLike(e) {
    $.waiting.show();
    var type = "POST";
    var val = false;
    var del = "";
    if ($.btn_like.liked) {
        type = "DELETE";
        del = "/" + favID;
    } else {
        type = "POST";
    }

    Ti.API.info("like id:" + del);

    require("/api").createAPI({
        type : type, url : "/posts/" + args.id + "/likes" + del, token : true, success : onPostLike, error : onPostLikeError, noJSON : val
    });
}

function onPostDelete(e) {
    $.waiting.hide();
    $.comments.close();
    if (refresh)
        refresh();
}

function onPostDeleteError(e) {
    $.waiting.hide();
}

function onFocus(e) {
    $.txt_comment.visible = true;
}

getStream();

// events

$.btn_close.addEventListener("click", onClickClose);
$.btn_post.addEventListener("click", onClickPost);
$.btn_like.addEventListener("click", onClickLike);
$.comments.addEventListener("focus", onFocus);