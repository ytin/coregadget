// Generated by CoffeeScript 1.3.3
(function() {
  var getAttendance, getDiscipline, getMorality, global, resetData, resetSchoolYearSeme;

  global = {};

  jQuery(function() {
    gadget.autofit(document.getElementById("widget"));
    gadget.onSizeChanged(function(size) {
      return $("#behavior").height(size.height - 110);
    });
    $("#children-list").on("click", "a", function(e) {
      $('#children-list li[class=active]').removeClass('active');
      $(this).parent().addClass('active');
      global.student = global.students[$(this).attr("children-index")];
      global.behavior = {
        schoolYear: global.schoolYear,
        semester: global.semester
      };
      $("#behavior #discipline tbody").html("");
      resetSchoolYearSeme();
      resetData();
      getMorality();
      getAttendance();
      return getDiscipline();
    });
    $("#behavior .btn-group").on("click", ".btn", function(e) {
      if (global.student != null) {
        global.behavior = {
          schoolYear: $(this).attr("school-year"),
          semester: $(this).attr("semester")
        };
        resetData();
        getMorality();
        getAttendance();
        return getDiscipline();
      }
    });
    $("#behavior").hover(function() {
      return $(this).css("overflow", "auto");
    }, function() {
      return $(this).css("overflow", "hidden");
    });
    $("#discipline a[my-toggle=collapse]").click(function() {
      return $("#collapseD").slideToggle(500);
    });
    return gadget.getContract("ischool.AD.parent").send({
      service: "_.GetCurrentSemester",
      body: "",
      result: function(response, error, xhr) {
        if (error != null) {
          return $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetCurrentSemester)\n</div>");
        } else {
          global.schoolYear = response.Current.SchoolYear;
          global.semester = response.Current.Semester;
          return gadget.getContract("ischool.AD.parent").send({
            service: "_.GetStudentInfo",
            body: "",
            result: function(response, error, xhr) {
              var items, _ref;
              if (error != null) {
                return $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetStudentInfo)\n</div>");
              } else {
                if (((_ref = response.Result) != null ? _ref.Student : void 0) != null) {
                  resetData();
                  global.students = $(response.Result.Student);
                  items = [];
                  global.students.each(function(index, student) {
                    return items.push("<li " + (index === 0 ? " class='active'" : '') + ">\n  <a href='#' children-index='" + index + "'>" + this.StudentName + "</a>\n</li>");
                  });
                  return $("#children-list").html(items.join("")).find('a:first').trigger('click');
                }
              }
            }
          });
        }
      }
    });
  });

  resetSchoolYearSeme = function() {
    var items, student;
    student = global.student;
    items = [];
    if (student.SemsHistory != null) {
      $(student.SemsHistory).each(function(index, item) {
        if (item.History != null) {
          return $(item.History).each(function(e) {
            if (!(this.SchoolYear === global.schoolYear && this.Semester === global.semester)) {
              return items.push("<button class='btn btn-large' school-year='" + this.SchoolYear + "' semester='" + this.Semester + "'>" + (this.SchoolYear + '' + this.Semester) + "</button>");
            }
          });
        }
      });
      items.push("<button class='btn btn-large active' school-year='" + global.schoolYear + "' semester='" + global.semester + "'>" + (global.schoolYear + '' + global.semester) + "</button>");
      return $("#behavior .btn-group").html(items.reverse().join(""));
    }
  };

  resetData = function() {
    $("#behavior #morality tbody").html("");
    $("#behavior #attendance .my-content").html("");
    $("#behavior #discipline tbody").html("");
    $("#merit-a").html("<span class='badge'>0</span>");
    $("#merit-b").html("<span class='badge'>0</span>");
    $("#merit-c").html("<span class='badge'>0</span>");
    $("#demerit-a").html("<span class='badge'>0</span>");
    $("#demerit-b").html("<span class='badge'>0</span>");
    $("#demerit-c").html("<span class='badge'>0</span>");
    return $("#discipline-view").addClass("hide");
  };

  getMorality = function() {
    return gadget.getContract("ischool.AD.parent").send({
      service: "_.GetMoralScore",
      body: "<Request>\n  <StudentID>" + global.student.StudentID + "</StudentID>\n  <SchoolYear>" + global.behavior.schoolYear + "</SchoolYear>\n  <Semester>" + global.behavior.semester + "</Semester>\n</Request>",
      result: function(response, error, xhr) {
        var items, _ref;
        if (error != null) {
          return $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetMoralScore)\n</div>");
        } else {
          items = [];
          if (((_ref = response.Result.DailyLifeScore) != null ? _ref.TextScore : void 0) != null) {
            $(response.Result.DailyLifeScore.TextScore).each(function() {
              var _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
              if (this.DailyBehavior != null) {
                items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#DailyBehavior\">\n      " + ((_ref1 = this.DailyBehavior.Name) != null ? _ref1 : '日常行為表現') + "\n    </a>\n  </div>\n  <div id=\"DailyBehavior\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      <table class=\"table table-striped\">\n        <tbody>");
                $(this.DailyBehavior.Item).each(function() {
                  var _ref2, _ref3, _ref4;
                  return items.push("<tr>\n  <th><span>" + ((_ref2 = this.Name) != null ? _ref2 : '') + "</span></th>\n  <td><span>" + ((_ref3 = this.Index) != null ? _ref3 : '') + "</span></td>\n  <td><span>" + ((_ref4 = this.Degree) != null ? _ref4 : '') + "</span></td>\n</tr>");
                });
                items.push("          </tbody>\n        </table>\n      </div>\n    </div>\n</div>");
              }
              if (this.GroupActivity != null) {
                items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#GroupActivity\">\n      " + ((_ref2 = this.GroupActivity.Name) != null ? _ref2 : '團體活動表現') + "\n    </a>\n  </div>\n  <div id=\"GroupActivity\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      <table class=\"table table-striped\">\n        <tbody>");
                $(this.GroupActivity.Item).each(function() {
                  var _ref3, _ref4, _ref5;
                  return items.push("<tr>\n  <th><span>" + ((_ref3 = this.Name) != null ? _ref3 : '') + "</span></th>\n  <td><span>" + ((_ref4 = this.Degree) != null ? _ref4 : '') + "</span></td>\n  <td><span>" + ((_ref5 = this.Description) != null ? _ref5 : '') + "</span></td>\n</tr>");
                });
                items.push("          </tbody>\n        </table>\n      </div>\n    </div>\n</div>");
              }
              if (this.PublicService != null) {
                items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#PublicService\">\n      " + ((_ref3 = this.PublicService.Name) != null ? _ref3 : '公共服務表現') + "\n    </a>\n  </div>\n  <div id=\"PublicService\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      <table class=\"table table-striped\">\n        <tbody>");
                $(this.PublicService.Item).each(function() {
                  var _ref4, _ref5;
                  return items.push("<tr>\n  <th><span>" + ((_ref4 = this.Name) != null ? _ref4 : '') + "</span></th>\n  <td><span>" + ((_ref5 = this.Description) != null ? _ref5 : '') + "</span></td>\n</tr>");
                });
                items.push("          </tbody>\n        </table>\n      </div>\n    </div>\n</div>");
              }
              if (this.SchoolSpecial != null) {
                items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#SchoolSpecial\">\n      " + ((_ref4 = this.SchoolSpecial.Name) != null ? _ref4 : '校內外特殊表現') + "\n    </a>\n  </div>\n  <div id=\"SchoolSpecial\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      <table class=\"table table-striped\">\n        <tbody>");
                $(this.SchoolSpecial.Item).each(function() {
                  var _ref5, _ref6;
                  return items.push("<tr>\n  <th><span>" + ((_ref5 = this.Name) != null ? _ref5 : '') + "</span></th>\n  <td><span>" + ((_ref6 = this.Description) != null ? _ref6 : '') + "</span></td>\n</tr>");
                });
                items.push("          </tbody>\n        </table>\n      </div>\n    </div>\n</div>");
              }
              if (this.DailyLifeRecommend != null) {
                items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#DailyLifeRecommend\">\n      " + ((_ref5 = this.DailyLifeRecommend.Name) != null ? _ref5 : '日常生活表現具體建議') + "\n    </a>\n  </div>\n  <div id=\"DailyLifeRecommend\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      " + ((_ref6 = this.DailyLifeRecommend.Description) != null ? _ref6 : this.DailyLifeRecommend['#text']) + "\n    </div>\n  </div>\n</div>");
              }
              if (this.OtherRecommend != null) {
                return items.push("<div class=\"accordion-group\">\n  <div class=\"accordion-heading\">\n    <a class=\"accordion-toggle\" data-toggle=\"collapse\" data-parent=\"#accordion2\" href=\"#OtherRecommend\">\n      " + ((_ref7 = this.OtherRecommend.Name) != null ? _ref7 : '其他具體建議') + "\n    </a>\n  </div>\n  <div id=\"OtherRecommend\" class=\"accordion-body collapse\">\n    <div class=\"accordion-inner\">\n      " + ((_ref8 = this.OtherRecommend['#text']) != null ? _ref8 : '') + "\n    </div>\n  </div>\n</div>");
              }
            });
            if (items.join("") === "") {
              return $("#behavior #morality #accordion-m").html("目前無資料");
            } else {
              $("#behavior #morality #accordion-m").html(items.join(""));
              $("#behavior #morality h2").html("日常生活表現");
              return $('#behavior #morality table').find('tr:first td, tr:first th').css("border-top-color", "transparent");
            }
          } else {
            return $("#behavior #morality #accordion-m").html("目前無資料");
          }
        }
      }
    });
  };

  getAttendance = function() {
    return gadget.getContract("ischool.AD.parent").send({
      service: "_.GetAttendanceRecord",
      body: "<Request>\n  <StudentID>" + global.student.StudentID + "</StudentID>\n  <SchoolYear>" + global.behavior.schoolYear + "</SchoolYear>\n  <Semester>" + global.behavior.semester + "</Semester>\n</Request>",
      result: function(response, error, xhr) {
        var absences, items, name, _ref, _ref1;
        if (error != null) {
          return $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetAttendanceRecord)\n</div>");
        } else {
          absences = {};
          if (((_ref = response.Result) != null ? _ref.Attendance : void 0) != null) {
            $(response.Result.Attendance).each(function() {
              return $(this.Detail.Attendance.Period).each(function() {
                if (!(absences[this['AbsenceType']] != null)) {
                  absences[this['AbsenceType']] = 0;
                }
                return absences[this['AbsenceType']] += 1;
              });
            });
          }
          items = [];
          for (name in absences) {
            items.push("<li class='span2'>\n  <div class='thumbnail my-thumbnail-white'>\n    <div class='my-subthumbnail-top'>\n      <span class='badge badge-warning'>" + ((_ref1 = absences[name]) != null ? _ref1 : '') + "</span>\n    </div>\n    <div class='caption my-subthumbnail-bottom'>\n      <h5>" + (name != null ? name : '') + "</h5>\n    </div>\n  </div>\n</li>");
          }
          if (items.join("") === "") {
            return $("#behavior #attendance .my-content").html("目前無資料");
          } else {
            return $("#behavior #attendance .my-content").html("<ul class='thumbnails'>\n  " + (items.join("")) + "\n</ul>");
          }
        }
      }
    });
  };

  getDiscipline = function() {
    return gadget.getContract("ischool.AD.parent").send({
      service: "_.GetDisciplineRecord",
      body: "<Request>\n  <StudentID>" + global.student.StudentID + "</StudentID>\n  <SchoolYear>" + global.behavior.schoolYear + "</SchoolYear>\n  <Semester>" + global.behavior.semester + "</Semester>\n</Request>",
      result: function(response, error, xhr) {
        var items, sum_merit, _ref;
        if (error != null) {
          return $("#mainMsg").html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  <strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(GetDisciplineRecord)\n</div>");
        } else {
          items = [];
          if (((_ref = response.Result) != null ? _ref.Discipline : void 0) != null) {
            sum_merit = {
              ma: 0,
              mb: 0,
              mc: 0,
              da: 0,
              db: 0,
              dc: 0,
              dd: 0
            };
            $(response.Result.Discipline).each(function() {
              var merit, merit_clear, _ref1, _ref2, _ref3;
              merit = {
                a: 0,
                b: 0,
                c: 0
              };
              if (this.MeritFlag === "1") {
                if (!isNaN(parseInt(this.Detail.Discipline.Merit.A, 10))) {
                  sum_merit.ma += merit.a = parseInt(this.Detail.Discipline.Merit.A, 10);
                }
                if (!isNaN(parseInt(this.Detail.Discipline.Merit.B, 10))) {
                  sum_merit.mb += merit.b = parseInt(this.Detail.Discipline.Merit.B, 10);
                }
                if (!isNaN(parseInt(this.Detail.Discipline.Merit.C, 10))) {
                  sum_merit.mc += merit.c = parseInt(this.Detail.Discipline.Merit.C, 10);
                }
                return items.push("<tr>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.a !== 0 ? "badge-success" : "") + "\">" + merit.a + "</span>\n    <br />大功\n  </td>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.b !== 0 ? "badge-success" : "") + "\">" + merit.b + "</span>\n    <br />小功\n  </td>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.c !== 0 ? "badge-success" : "") + "\">" + merit.c + "</span>\n    <br />嘉獎\n  </td>\n  <td>\n    <span>" + (this.OccurDate.substr(0, 10)) + "</span>\n    <br/>\n    <span>" + ((_ref1 = this.Reason) != null ? _ref1 : '') + "</span>\n  </td>\n</tr>");
              } else {
                if (!isNaN(parseInt(this.Detail.Discipline.Demerit.A, 10))) {
                  merit.a = parseInt(this.Detail.Discipline.Demerit.A, 10);
                }
                if (!isNaN(parseInt(this.Detail.Discipline.Demerit.B, 10))) {
                  merit.b = parseInt(this.Detail.Discipline.Demerit.B, 10);
                }
                if (!isNaN(parseInt(this.Detail.Discipline.Demerit.C, 10))) {
                  merit.c = parseInt(this.Detail.Discipline.Demerit.C, 10);
                }
                merit_clear = this.Detail.Discipline.Demerit.Cleared;
                if (merit_clear !== '是') {
                  sum_merit.da += merit.a;
                  sum_merit.db += merit.b;
                  sum_merit.dc += merit.c;
                }
                return items.push("<tr>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.a !== 0 && merit_clear === "是" ? "badge-warning" : (merit.a !== 0 ? "badge-important" : "")) + "\">" + merit.a + "</span>\n    <br />大過\n  </td>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.b !== 0 && merit_clear === '是' ? "badge-warning" : (merit.b !== 0 ? "badge-important" : "")) + "\">" + merit.b + "</span>\n    <br />小過\n  </td>\n  <td class=\"my-flags\">\n    <span class=\"badge " + (merit.c !== 0 && merit_clear === '是' ? "badge-warning" : (merit.c !== 0 ? "badge-important" : "")) + "\">" + merit.c + "</span>\n    <br />警告\n  </td>\n  <td>\n    " + (this.Detail.Discipline.Demerit.Cleared === '是' ? "<span class='my-offset'>" + (this.Detail.Discipline.Demerit.ClearDate.substr(0, 10).replace(/\//ig, "-")) + " 已銷過<br/>" + ((_ref2 = this.Detail.Discipline.Demerit.ClearReason) != null ? _ref2 : '') + "</span><br/>" : "") + "\n    <span>" + (this.OccurDate.substr(0, 10)) + "</span>\n    <br/>\n    <span>" + ((_ref3 = this.Reason) != null ? _ref3 : '') + "</span>\n  </td>\n</tr>");
              }
            });
            $("#merit-a").html("<span class='badge " + (sum_merit.ma !== 0 ? "badge-success" : "") + "'>" + sum_merit.ma + "</span>");
            $("#merit-b").html("<span class='badge " + (sum_merit.mb !== 0 ? "badge-success" : "") + "'>" + sum_merit.mb + "</span>");
            $("#merit-c").html("<span class='badge " + (sum_merit.mc !== 0 ? "badge-success" : "") + "'>" + sum_merit.mc + "</span>");
            $("#demerit-a").html("<span class='badge " + (sum_merit.da !== 0 ? "badge-important" : "") + "'>" + sum_merit.da + "</span>");
            $("#demerit-b").html("<span class='badge " + (sum_merit.db !== 0 ? "badge-important" : "") + "'>" + sum_merit.db + "</span>");
            $("#demerit-c").html("<span class='badge " + (sum_merit.dc !== 0 ? "badge-important" : "") + "'>" + sum_merit.dc + "</span>");
            $("#discipline-view").removeClass("hide");
            return $("#behavior #discipline tbody").html(items.join(""));
          }
        }
      }
    });
  };

}).call(this);
