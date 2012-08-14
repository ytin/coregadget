﻿var _gg = _gg || {};
_gg.connection = gadget.getContract("ischool.club.student");
_gg.Clubs = [];
_gg.Club = '';
_gg.Student = {};
_gg.SchoolYear = '';
_gg.Semester = '';


jQuery(function () {
    $("#editModal").modal({
        show: false
    });
    $("#editModal").on("hidden", function () {
        $("#editModal #errorMessage").html("");
    });
    $("#editModal").on("show", function () {
        $("#editModal #save-data").show();
    });
    $("#editModal #save-data").click(function () {
        var edit_target;
        $("#editModal #save-data").hide();
        edit_target = $(this).attr("edit-target");
        switch (edit_target) {
            case "remove":
                _gg.RemoveToClub();
                break;
            default:
                _gg.AddToClub();
                break;
        }
    });

    $("#filter-keyword").keyup(function () {
        _gg.resetClubList();
    });

    $(".icon-search").click(function () {
        _gg.resetClubList();
    });

    _gg.resetClubList = function () {
        var tmp_HTML, items;
        _gg.ResetData();
        items = [];
        tmp_HTML = "<ul class='nav nav-tabs nav-stacked'>";
        $(_gg.Clubs).each(function (index, item) {
            if (item) {
                if (item.ClubName.indexOf($("#filter-keyword").val()) !== -1) {
                    items.push("<li club-id='" + item.ClubID + "'><a href='#' club-index='" + index + "' data-toggle='tab'><span>" + this.ClubName + "</span> <span class='pull-right'>(<span data-type='club-man-count'>" + this.TotalCount + "</span>/<span>" + (item.Limit ? item.Limit : '不限') + "</span>)</span></a></li>");
                }
            }
        });
        tmp_HTML += items.join("");
        tmp_HTML += "</ul>";
        $("#club-list .tabbable").html(tmp_HTML);
        $("#club-list a").click(function (e) {
            e.preventDefault();

            _gg.Club = _gg.Clubs[$(this).attr("club-index")];
            _gg.ResetData();
            _gg.setClubInfo();
        });
    };


    // TODO: 取得目前學年度學期
    _gg.connection.send({
        service: "_.GetCurrentSemester",
        body: '',
        result: function (response, error, http) {
            if (error !== null) {
                $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetCurrentSemester)\n</div>");
            } else {
                $(response.Result.SystemConfig).each(function (index, item) {
                    _gg.SchoolYear = item.DefaultSchoolYear;
                    _gg.Semester = item.DefaultSemester;
                });

                // TODO: 取得個人資料
                _gg.connection.send({
                    service: "_.GetMyBaseInfo",
                    body: '',
                    result: function (response, error, http) {
                        if (error !== null) {
                            $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetMyBaseInfo)\n</div>");
                        } else {
                            $(response.Response.Student).each(function (index, item) {
                                _gg.Student = item;
                            });

                            var student = _gg.Student;
                            _gg.Opening = "no";

                            // TODO: 取得開放時間
                            _gg.connection.send({
                                service: "_.GetOpeningHours",
                                body: '<Request><GradeYear>' + student.GradeYear + '</GradeYear></Request>',
                                result: function (response, error, http) {
                                    if (error !== null) {
                                        $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetOpeningHours)\n</div>");
                                    } else {
                                        $(response.Response.OpeningHours).each(function (index, item) {
                                            if (item.Startdate && item.Enddate) {
                                                var tmp_Date = new Date();
                                                var Startdate = new Date(item.Startdate);
                                                var Enddate = new Date(item.Enddate);

                                                if (Startdate <= tmp_Date && Enddate >= tmp_Date) {
                                                    _gg.Opening = "yes";
                                                } else {
                                                    _gg.Opening = "no";
                                                }

                                                $("span[data-type=Opening]").html("開放選社時間：" + $.formatDate(Startdate, "yyyyMMdd") + " " + $.formatDate(Startdate, "HHmm") + " ~ " + $.formatDate(Enddate, "yyyyMMdd") + " " + $.formatDate(Enddate, "HHmm"));
                                            } else {
                                                $("sapn[data-type=Opening]").html("開放選社時間：未指定");
                                            }
                                        });
                                    }
                                }
                            });

                            // TODO: 取得本學年度學期個人選社資料
                            _gg.connection.send({
                                service: "_.GetMyClub",
                                body: '<Request><SchoolYear>' + _gg.SchoolYear + '</SchoolYear><Semester>' + _gg.Semester + '</Semester></Request>',
                                result: function (response, error, http) {
                                    if (error !== null) {
                                        $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetMyClub)\n</div>");
                                    } else {
                                        $(response.Response.Clubs).each(function (index, item) {
                                            student.ClubID = item.ClubID;
                                            student.Lock = item.Lock;
                                        });


                                        // TODO: 目前學年度學期社團資料(已過濾性別、總人數=0、科別條件)
                                        _gg.connection.send({
                                            service: "_.GetAllClubs",
                                            body: '<Request><SchoolYear>' + _gg.SchoolYear + '</SchoolYear><Semester>' + _gg.Semester + '</Semester></Request>',
                                            result: function (response, error, http) {
                                                if (error !== null) {
                                                    $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetClubStatus)\n</div>");
                                                } else {
                                                    var tmp_HTML, items, tmp_class, tmp_show;
                                                    _gg.ResetData();

                                                    items = [];
                                                    tmp_HTML = "<ul class='nav nav-tabs nav-stacked'>";

                                                    if ($(response.Response.ClubRecord).size() === 0) {
                                                        $("#filter-keyword").addClass("disabled").attr("disabled", "disabled");
                                                        $("#club-list .tabbable").html("目前無社團");
                                                        $("div[data-type] tbody").html("目前無社團");
                                                        $("div[data-type=summary] .my-widget-content").html("目前無社團");
                                                    } else {
                                                        $(response.Response.ClubRecord).each(function (index, item) {
                                                            tmp_show = "false";
                                                            if (student.Lock === '是') {
                                                                if (student.ClubID === item.ClubID) {
                                                                    tmp_show = "true";
                                                                }
                                                            } else {
                                                                tmp_show = "true";
                                                            }

                                                            if (tmp_show === "true") {
                                                                tmp_class = '';
                                                                if (!_gg.Club) {
                                                                    _gg.Club = item;
                                                                    tmp_class = ' class="active"';
                                                                }

                                                                if (!_gg.Clubs[index]) {
                                                                    _gg.Clubs[index] = item;
                                                                    item.getInfo = "false";
                                                                }
                                                                items.push("<li club-id='" + item.ClubID + "'" + tmp_class + "><a href='#' club-index='" + index + "' data-toggle='tab'><span>" + item.ClubName + "</span> <span class='pull-right'>(<span data-type='club-man-count'>" + item.TotalCount + "</span>/<span>" + (item.Limit ? item.Limit : '不限') + "</span>)</span></a></li>");
                                                            }
                                                        });

                                                        tmp_HTML += items.join("");
                                                        tmp_HTML += "</ul>";
                                                        $("#club-list .tabbable").html(tmp_HTML);
                                                        $("#club-list a").click(function (e) {
                                                            e.preventDefault();

                                                            _gg.Club = _gg.Clubs[$(this).attr("club-index")];
                                                            _gg.ResetData();
                                                            _gg.setClubInfo();
                                                        });
                                                        _gg.setClubInfo();
                                                    }
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });

            }
        }
    });
});


// TODO: 社團資料
_gg.setClubInfo = function () {
    var club = _gg.Club;
    if (club.ClubID) {       

        var showInfo = function () {
            var items_info, items_condition, items_summary, tmp_photo1, tmp_photo2;
            var tmp_grade1Limit, tmp_grade2Limit, tmp_limit, tmp_genderRestrict, tmp_deptRestrict;

            items_info = [];
            items_condition = [];
            items_summary = [];
            tmp_photo1, tmp_photo2;
            tmp_grade1Limit = '不限', tmp_grade2Limit = '不限', tmp_limit = '不限', tmp_genderRestrict = '不限', tmp_deptRestrict = '不限';

            // TODO: 社團基本資料
            items_info.push('<tr><th nowrap="nowrap">學年 </th><td>' + club.SchoolYear + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">學期 </th><td>' + club.Semester + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">類別 </th><td>' + club.ClubCategory + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">編號 </th><td>' + club.ClubNumber + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">老師1 </th><td>' + club.TeacherName1 + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">老師2 </th><td>' + club.TeacherName2 + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">老師3 </th><td>' + club.TeacherName3 + '</td></tr>');
            items_info.push('<tr><th nowrap="nowrap">場地 </th><td>' + club.Location + '</td></tr>');

            // TODO: 社團條件
            if (club.Grade1Limit) {
                tmp_grade1Limit = club.Grade1Limit + ' 人，現已 <span grade_year="1">' + club.GradeYear1Count + '</span> 人';
            }
            if (club.Grade2Limit) {
                tmp_grade2Limit = club.Grade2Limit + ' 人，現已 <span grade_year="2">' + club.GradeYear2Count + '</span> 人';
            }
            if (club.Limit) {
                tmp_limit = club.Limit + '人';
            }

            if (club.GenderRestrict) { tmp_genderRestrict = club.GenderRestrict + '生' };

            if (club.DeptRestrict.Department) {
                tmp_deptRestrict = "";
                $(club.DeptRestrict.Department.Dept).each(function (key, value) {
                    tmp_deptRestrict += value + '<br />';
                });
            }

            items_condition.push('<tr><th width="29%" nowrap="nowrap">年級 </th><td width="71%">一年級 ' + tmp_grade1Limit + '</td></tr>');
            items_condition.push('<tr><th nowrap="nowrap">&nbsp;</th><td>二年級 ' + tmp_grade2Limit + '</td></tr>');
            items_condition.push('<tr><th nowrap="nowrap">總額 </th><td>' + tmp_limit + ' </td></tr>');
            items_condition.push('<tr><th nowrap="nowrap">性別 </th><td>' + tmp_genderRestrict + '</td></tr>');
            items_condition.push('<tr><th nowrap="nowrap">科別 </th><td>' + tmp_deptRestrict + '</td></tr>');

            // TODO: 社團簡介
            items_summary.push('<p>' + club.About + '</p>');
            items_summary.push('<ul class="thumbnails">');
            tmp_photo1 = (club.Photo1 != null && club.Photo1 !== "") ? "<li class='thumbnail'><img src='data:image/png;base64," + club.Photo1 + "' alt='社團照片1' title='社團照片1'/></li>" : "";
            tmp_photo2 = (club.Photo2 != null && club.Photo2 !== "") ? "<li class='thumbnail'><img src='data:image/png;base64," + club.Photo2 + "' alt='社團照片2' title='社團照片2'/></li>" : "";
            items_summary.push(tmp_photo1);
            items_summary.push(tmp_photo2);
            items_summary.push('</ul>');

            $("span[data-type=club-name]").html(club.ClubName);
            $("div[data-type=info] tbody").html(items_info.join(""));
            $("div[data-type=condition] tbody").html(items_condition.join(""));
            $("div[data-type=summary] .my-widget-content").html(items_summary.join(""));

            _gg.Check_State();
        };

        if (club.getInfo === "false") {
            _gg.connection.send({
                service: "_.GetClubInfo",
                body: '<Request><ClubID>' + club.ClubID + '</ClubID></Request>',
                result: function (response, error, http) {
                    if (error !== null) {
                        $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetClubInfo)\n</div>");
                    } else {
                        $(response.Response.ClubRecord).each(function (index, item) {
                            $.each(item, function (key, value) {
                                club[key] = value;
                            });
                            club.getInfo = "true";
                            showInfo();
                        });
                    }
                }
            });
        } else {
            showInfo();
        }
    }
};


_gg.Check_State = function () {
    /*
    1. 未開放時 => 未開放選社(不能點選) (預設)
    2. 開放期間，尚未加入，未額滿 => 加入社團
    3. 開放期間，尚未加入，已額滿 => 額滿(不能點選)
    4. 開放期間，已加入 => 退出
    5. 開放期間，鎖定不可變更 => 選社已鎖定(不能點選)
    */

    var club = _gg.Club;
    var state = "0";

    if (_gg.Opening === "yes") {
        if (_gg.Student.ClubID === club.ClubID) {
            state = (_gg.Student.Lock === "是") ? "5" : "4";
        } else {
            switch (_gg.Student.GradeYear) {
                case "1":
                    if (club.Grade1Limit) {
                        state = (parseInt(club.Grade1Limit, 10) - parseInt(club.GradeYear1Count, 10) > 0) ? "2" : "3";
                    }
                    break;
                case "2":
                    if (club.Grade2Limit) {
                        state = (parseInt(club.Grade2Limit, 10) - parseInt(club.GradeYear2Count, 10) > 0) ? "2" : "3";
                    }
                    break;
            }

            if (club.Limit) {
                state = (parseInt(club.Limit, 10) - parseInt(club.TotalCount, 10) > 0) ? "2" : "3";
            } else {
                state = "2";
            }
        }
    } else {
        state = "1";
    }

    switch (state) {
        case "1":
            $("div[data-type=add-club]").html('<a class="btn btn-success pull-right disabled"><i class="icon-plus icon-white"></i>未開放選社</a>');
            break;
        case "2":
            $("div[data-type=add-club]").html('<a class="btn btn-success pull-right" action-type="add"><i class="icon-plus icon-white"></i>加入社團</a>');
            break;
        case "3":
            $("div[data-type=add-club]").html('<a class="btn btn-success pull-right disabled">已額滿</a>');
            break;
        case "4":
            $("div[data-type=add-club]").html('<a class="btn btn-success pull-right" action-type="remove"><i class="icon-minus icon-white"></i>退出社團</a>');
            break;
        case "5":
            $("div[data-type=add-club]").html('<a class="btn btn-success pull-right" disabled>選社已鎖定</a>');
            break;            
        default:
    }

    $("a[action-type=add]").bind('click', function () {
        $("#editModal h3").html("加入社團");
        if (_gg.Student.ClubID) {
            $("#editModal .modal-body").html("退出原社團，再加入" + club.ClubName + "嗎？");
        } else {
            $("#editModal .modal-body").html("想要加入" + club.ClubName + "嗎？");
        }

        $("#editModal #save-data").html("我要加入").attr("edit-target", "add");
        $("#editModal").modal("show");
    });

    $("a[action-type=remove]").bind('click', function () {
        $("#editModal h3").html("退出社團");
        $("#editModal .modal-body").html("想要退出" + club.ClubName + "嗎？");
        $("#editModal #save-data").html("我要退出").attr("edit-target", "remove"); ;
        $("#editModal").modal("show");

    });

    // TODO: 我加入的社團
    $("#club-list .my-add-in-club").removeClass("my-add-in-club");
    $("#club-list li[club-id=" + _gg.Student.ClubID + "]").addClass("my-add-in-club");

};


// TODO: 加入社團
_gg.AddToClub = function () {
    var club = _gg.Club;
    if (club.ClubID) {
        _gg.connection.send({
            service: "_.SetMyClub",
            body: '<Request><SCJoin><ClubID>' + club.ClubID + '</ClubID></SCJoin></Request>',
            result: function (response, error, http) {
                if (error !== null) {
                    if (error.dsaError.status === "504") {
                        $("#editModal #errorMessage").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>加入失敗，已過開放選社時間!</strong>\n</div>");
                    } else {
                        $("#editModal #errorMessage").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>加入失敗，請稍候重試!</strong>(SetMyClub)\n</div>");
                    }
                } else {
                    $("#editModal").modal("hide");
                    _gg.Student.ClubID = club.ClubID;
                    _gg.RefreshCount();
                }
            }
        });
    } else {
        $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>加入社團的資料不正確，請重新操作!</strong>(RemoveClub)\n</div>");
    }
};

// TODO: 退出社團
_gg.RemoveToClub = function () {
    var club = _gg.Club;
    if (club.ClubID) {
        _gg.connection.send({
            service: "_.RemoveClub",
            body: '<Request><SCJoin><ClubID>' + club.ClubID + '</ClubID></SCJoin></Request>',
            result: function (response, error, http) {
                if (error !== null) {
                    if (error.dsaError.status === "504") {
                        $("#editModal #errorMessage").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>退出失敗，已過開放選社時間!</strong>\n</div>");
                    } else {
                        $("#editModal #errorMessage").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>退出失敗，請稍候重試!</strong>(RemoveClub)\n</div>");
                    }                    
                } else {
                    $("#editModal").modal("hide");
                    _gg.Student.ClubID = "";
                    _gg.RefreshCount();
                }
            }
        });
    } else {
        $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>退出社團的資料不正確，請重新操作!</strong>(RemoveClub)\n</div>");
    }
};


// TODO: 更新人數資料
_gg.RefreshCount = function () {
    var club = _gg.Club;
    if (club.ClubID) {
        _gg.connection.send({
            service: "_.GetClubAttendNumber",
            body: '<Request><ClubID>' + club.ClubID + '</ClubID></Request>',
            result: function (response, error, http) {
                if (error !== null) {
                    $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetClubAttendNumber)\n</div>");
                } else {
                    $(response.Response.ClubRecord).each(function (index, item) {
                        club.TotalCount = item.TotalCount;
                        club.GradeYear1Count = item.GradeYear1Count;
                        club.GradeYear2Count = item.GradeYear2Count;
                        club.GradeYear3Count = item.GradeYear3Count;
                        $("#club-list li[club-id=" + club.ClubID + "] span[data-type=club-man-count]").html(item.TotalCount);
                        $("span[grade_year=1]").html(item.GradeYear1Count);
                        $("span[grade_year=2]").html(item.GradeYear2Count);
                        $("span[grade_year=3]").html(item.GradeYear3Count);
                    });
                    _gg.Check_State();                    
                }
            }
        });
    }
};

// TODO: 清除資料
_gg.ResetData = function () {
    $("span[data-type=club-name]").html("");
    $("div[data-type] tbody").html("");
    $("div[data-type=summary] .my-widget-content").html("");
    $("div[data-type=add-club]").html("");
};