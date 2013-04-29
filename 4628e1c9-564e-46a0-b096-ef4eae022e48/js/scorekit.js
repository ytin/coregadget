// Generated by CoffeeScript 1.3.3
(function() {
  var bindScores, getCourseTeacherList, getCourses, getSemester, params, printScore, saveScores, uploadScore;

  params = {
    courses: [],
    currentCourse: null,
    students: []
  };

  $(function() {
    gadget.autofit(document.getElementById("widget"));
    $(".course-select").change(function() {
      return $(params.courses).each(function() {
        if (this.CourseID === $(".course-select").val()) {
          params.currentCourse = this;
          return bindScores();
        }
      });
    });
    $(".save").click(function() {
      if ((params.currentCourse != null) && params.currentCourse.Confirmed !== 'true') {
        if (params.currentCourse.IsScored !== "true") {
          return alert("您並非評分教師，無法更動成績，如有任何疑問，請洽EMBA辦公室，謝謝!");
        } else if (confirm("是否確定儲存成績？") === true) {
          return saveScores();
        }
      }
    });
    $(".upload").click(function() {
      return uploadScore();
    });
    $(".print").click(function() {
      return printScore("score");
    });
    $(".print2").click(function() {
      return printScore("clear");
    });
    return getSemester();
  });

  getSemester = function() {
    return gadget.getContract("emba.teacher").send({
      service: "default.GetSemester",
      body: "",
      result: function(response, error, http) {
        if (response.Result != null) {
          params.CurrentSchoolYear = response.Result.SystemConfig.DefaultSchoolYear;
          params.CurrentSemester = response.Result.SystemConfig.DefaultSemester;
          return gadget.getContract("emba.teacher").send({
            service: "default.GetSubjectScoreLock",
            body: "<Request>\n	<SchoolYear>" + params.CurrentSchoolYear + "</SchoolYear>\n	<Semester>" + params.CurrentSemester + "</Semester>\n</Request>",
            result: function(response, error, http) {
              if (response.Result != null) {
                params.SubjectScoreLock = response.Result.IsLocked;
              }
              return getCourses();
            }
          });
        }
      }
    });
  };

  getCourses = function() {
    $(".course-select").html("<option value='0'>- 課程 -</option>");
    params.courses = [];
    return gadget.getContract("emba.teacher").send({
      service: "default.GetMyCourses",
      body: "<Request>\n	<SchoolYear>" + params.CurrentSchoolYear + "</SchoolYear>\n	<Semester>" + params.CurrentSemester + "</Semester>\n</Request>",
      result: function(response, error, http) {
        if (response.Result != null) {
          $(response.Result.Course).each(function() {
            params.courses.push(this);
            return $(".course-select").append("<option value='" + this.CourseID + "'>" + this.CourseTitle + "</option>");
          });
        }
        if (params.SubjectScoreLock === 't') {
          return $(".course-select").attr('disabled', 'disabled');
        }
      }
    });
  };

  getCourseTeacherList = function() {
    $(".teacher-list").html("任課教師：");
    return gadget.getContract("emba.teacher").send({
      service: "default.GetCourseTeacherList",
      body: {
        Request: {
          CourseID: params.currentCourse.CourseID
        }
      },
      result: function(response, error, http) {
        var teacher_name;
        if ((response.Result != null)) {
          teacher_name = [];
          $(response.Result.Teacher).each(function() {
            return teacher_name.push(this.TeacherName);
          });
          return $(".teacher-list").html("任課教師：" + (teacher_name.join()));
        }
      }
    });
  };

  bindScores = function() {
    getCourseTeacherList();
    $(".score-table tbody").html("");
    params.students = [];
    return gadget.getContract("emba.teacher").send({
      service: "default.GetStudents",
      body: {
        Request: {
          CourseID: params.currentCourse.CourseID
        }
      },
      result: function(response, error, http) {
        var rowIndex;
        if ((response.Result != null)) {
          params.students = $(response.Result.Student);
          rowIndex = 0;
          $(response.Result.Student).each(function(index, student) {
            var remark_item, score_item;
            score_item = "<td width='80px' student-index='" + index + "' row-index='" + rowIndex + "'>\n	<div class='score-item' contenteditable='true' student-index='" + index + "' row-index='" + rowIndex + "'>" + this.Score + "</div>\n</td>";
            remark_item = "<td width='80px' student-index='" + index + "' row-index='" + rowIndex + "'>\n	<div class='remark-item' contenteditable='true' student-index='" + index + "' row-index='" + rowIndex + "'>" + this.Remark + "</div>\n</td>";
            if (this.IsCancel === "t") {
              score_item = "<td width='100px'>***</td>";
              remark_item = "<td width='100px'>已停修</td>";
              this.Score = "***";
              this.Remark = "已停修";
            } else {
              rowIndex += 1;
            }
            return $(".score-table tbody").append("<tr>\n	<td width='200px'>" + this.Department + "</td>\n	<td width='100px'>" + this.StudentNumber + "</td>\n	<td width='100px'>" + this.Name + "</td>\n	" + score_item + "\n	" + remark_item + "\n</tr>");
          });
          $(".score-item").blur(function() {
            var index, score_type;
            index = parseInt($(this).attr("student-index"), 10);
            params.students[index].Score = $.trim($(this).html()).toUpperCase();
            score_type = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F", "X", "***", ""];
            if ($.inArray(params.students[index].Score, score_type) === -1) {
              params.students[index].Score = '';
              return $(this).html('');
            } else {
              return $(this).html($(this).html().toUpperCase());
            }
          });
          $(".score-item").keydown(function(event) {
            var stuIndex;
            if (event.keyCode === 13) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".score-item[row-index=" + (rowIndex + 1) + "]") != null) {
                $(".score-item[row-index=" + (rowIndex + 1) + "]").focus();
              }
              return false;
            }
            if (event.keyCode === 38) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".score-item[row-index=" + (rowIndex - 1) + "]") != null) {
                $(".score-item[row-index=" + (rowIndex - 1) + "]").focus();
              }
              return false;
            }
            if (event.keyCode === 40) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".score-item[row-index=" + (rowIndex + 1) + "]") != null) {
                $(".score-item[row-index=" + (rowIndex + 1) + "]").focus();
              }
              return false;
            }
          });
          $(".remark-item").blur(function() {
            var index;
            index = parseInt($(this).attr("student-index"), 10);
            return params.students[index].Remark = $.trim($(this).html());
          });
          return $(".remark-item").keydown(function(event) {
            var stuIndex;
            if (event.keyCode === 13) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".remark-item[row-index=" + (rowIndex + 1) + "]") != null) {
                $(".remark-item[row-index=" + (rowIndex + 1) + "]").focus();
              }
              return false;
            }
            if (event.keyCode === 38) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".remark-item[row-index=" + (rowIndex - 1) + "]") != null) {
                $(".remark-item[row-index=" + (rowIndex - 1) + "]").focus();
              }
              return false;
            }
            if (event.keyCode === 40) {
              stuIndex = parseInt($(this).attr("student-index"), 10);
              rowIndex = parseInt($(this).attr("row-index"), 10);
              if ($(".remark-item[row-index=" + (rowIndex + 1) + "]") != null) {
                $(".remark-item[row-index=" + (rowIndex + 1) + "]").focus();
              }
              return false;
            }
          });
        }
      }
    });
  };

  saveScores = function() {
    var add_content, has_fail_score, pass_score, score_type, update_content;
    add_content = [];
    update_content = [];
    score_type = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F", "X", "***", ""];
    pass_score = ["A+", "A", "A-", "B+", "B", "B-"];
    has_fail_score = false;
    $(".score-item").css('border-color', '#CCC');
    $(params.students).each(function(index, student) {
      var score;
      if ($.inArray(this.Score, score_type) === -1) {
        has_fail_score = true;
        $(".score-item[student-index=" + index + "]").css('border-color', '#F00');
      }
      score = {
        Score: this.IsCancel === "t" ? "X" : this.Score,
        IsPass: $.inArray(this.Score, pass_score !== -1) ? true : false,
        Remark: this.IsCancel === "t" ? "已停修" : this.Remark,
        OffsetCourse: "",
        RefCourseID: params.currentCourse.CourseID,
        RefStudentID: this.StudentID,
        RefSubjectID: params.currentCourse.SubjectID,
        SchoolYear: params.currentCourse.SchoolYear,
        Semester: params.currentCourse.Semester,
        Credit: params.currentCourse.Credit,
        IsRequired: params.currentCourse.IsRequired === "true" ? true : false,
        SubjectCode: params.currentCourse.SubjectCode,
        SubjectName: params.currentCourse.SubjectName
      };
      if (this.ScoreID === "") {
        return add_content.push(score);
      } else {
        score.ScoreID = this.ScoreID;
        return update_content.push(score);
      }
    });
    if (!has_fail_score) {
      return gadget.getContract("emba.teacher").send({
        service: "default.UpdateSubjectSemesterScore",
        body: {
          Request: {
            Score: update_content
          }
        },
        result: function(response, error, http) {
          if ((response.Result != null)) {
            return gadget.getContract("emba.teacher").send({
              service: "default.AddSubjectSemesterScore",
              body: {
                Request: {
                  Score: add_content
                }
              },
              result: function(response, error, http) {
                if (response.Result) {
                  alert("儲存成績完成!");
                  return bindScores();
                } else {
                  return alert("儲存成績失敗! 請稍候重試。");
                }
              }
            });
          } else {
            return alert("儲存成績失敗! 請稍候重試。");
          }
        }
      });
    } else {
      return alert("成績有誤，請修改後再儲存，謝謝!");
    }
  };

  uploadScore = function() {
    var add_content, has_fail_score, log, pass_score, score_type, update_content;
    if (params.currentCourse != null) {
      if (params.currentCourse.IsScored !== "true") {
        return alert("您並非評分教師，無法繳交成績!\n如有任何疑問，請洽EMBA辦公室，謝謝!");
      } else if (confirm("成績上傳後無法再做修改，是否確定上傳成績？\n如需更動成績，請洽EMBA辦公室，謝謝!") === true) {
        add_content = [];
        update_content = [];
        score_type = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "F", "X", "***"];
        pass_score = ["A+", "A", "A-", "B+", "B", "B-"];
        has_fail_score = false;
        log = "" + ($(".course-select").find("option:selected").text()) + "\n";
        $(params.students).each(function() {
          var score;
          if ($.inArray(this.Score, score_type) === -1) {
            has_fail_score = true;
          }
          score = {
            Score: this.IsCancel === "t" ? "X" : this.Score,
            IsPass: $.inArray(this.Score, pass_score !== -1) ? true : false,
            Remark: this.IsCancel === "t" ? "已停修" : this.Remark,
            OffsetCourse: "",
            RefCourseID: params.currentCourse.CourseID,
            RefStudentID: this.StudentID,
            RefSubjectID: params.currentCourse.SubjectID,
            SchoolYear: params.currentCourse.SchoolYear,
            Semester: params.currentCourse.Semester,
            Credit: params.currentCourse.Credit,
            IsRequired: params.currentCourse.IsRequired === "true" ? true : false,
            SubjectCode: params.currentCourse.SubjectCode,
            SubjectName: params.currentCourse.SubjectName
          };
          log += "\n" + this.Department + "_" + this.StudentNumber + "_" + this.Name + "： " + score.Score + ($.trim(score.Remark) !== '' ? ", " + score.Remark : "");
          if (this.ScoreID === "") {
            return add_content.push(score);
          } else {
            score.ScoreID = this.ScoreID;
            return update_content.push(score);
          }
        });
        if (!has_fail_score) {
          return gadget.getContract("emba.teacher").send({
            service: "default.UpdateSubjectSemesterScore",
            body: {
              Request: {
                Score: update_content
              }
            },
            result: function(response, error, http) {
              if ((response.Result != null)) {
                return gadget.getContract("emba.teacher").send({
                  service: "default.AddSubjectSemesterScore",
                  body: {
                    Request: {
                      Score: add_content
                    }
                  },
                  result: function(response, error, http) {
                    if ((response.Result != null)) {
                      return gadget.getContract("emba.teacher").send({
                        service: "default.UpdateCourseExt",
                        body: {
                          Request: {
                            Course: {
                              CourseID: params.currentCourse.CourseID,
                              Confirmed: true
                            }
                          }
                        },
                        result: function(response, error, http) {
                          if (response.Result != null) {
                            if (confirm("上傳成績完成!\n是否「列印成績確認單」？") === true) {
                              printScore("score");
                            }
                            params.currentCourse.Confirmed = "true";
                            $(params.courses).each(function() {});
                            if (this.CourseID === params.currentCourse.CourseID) {
                              this.Confirmed = "true";
                            }
                            $(".save").attr("disabled", "disabled");
                            $(".upload").attr("disabled", "disabled");
                          } else {
                            alert("上傳成績失敗! 請稍候重試。");
                          }
                          return gadget.getContract("emba.student").send({
                            service: "public.AddLog",
                            body: "<Request>\n	<Log>\n		<Actor>" + (gadget.getContract("emba.teacher").getUserInfo().UserName) + "</Actor>\n		<ActionType>更新</ActionType>\n		<Action>更新成績</Action>\n		<TargetCategory>ischool.emba.subject_semester_score</TargetCategory>\n		<ClientInfo><ClientInfo></ClientInfo></ClientInfo>\n		<ActionBy>ischool web 成績輸入小工具</ActionBy>\n		<Description>" + log + "</Description>\n	</Log>\n</Request>"
                          });
                        }
                      });
                    } else {
                      return alert("上傳成績失敗! 請稍候重試。");
                    }
                  }
                });
              } else {
                return alert("上傳成績失敗! 請稍候重試。");
              }
            }
          });
        } else {
          return alert("尚有未輸入成績或成績有誤，請修改後再繳交，謝謝!");
        }
      }
    }
  };

  printScore = function(type) {
    var content, doc, i, page_count, print_content, print_pages, _i;
    if (params.currentCourse != null) {
      if (type === "score" && params.currentCourse.Confirmed !== "true") {
        return alert("成績尚未上傳，無法列印成績報告單，謝謝!");
      } else {
        print_pages = [];
        print_content = [];
        page_count = (parseInt(params.students.length / 50, 10)) + (params.students.length % 50 > 0 ? 1 : 0);
        for (i = _i = 0; 0 <= page_count ? _i < page_count : _i > page_count; i = 0 <= page_count ? ++_i : --_i) {
          print_pages.push($("<div>" + ($(".print-page").html()) + "</div>"));
        }
        $(print_pages).each(function(index, page) {
          var tr, _j;
          $(page).find(".title").html("<div>臺灣大學 " + params.currentCourse.SchoolYear + " 學年度第 " + (params.currentCourse.Semester === '0' ? '暑期' : params.currentCourse.Semester) + " 學期成績報告單</div>");
          $(page).find(".course-info .subject-code").html("課程編號：" + params.currentCourse.NewSubjectCode + " (" + params.currentCourse.SubjectCode + ")");
          $(page).find(".course-info .subject-name").html("科目名稱：" + params.currentCourse.SubjectName);
          $(page).find(".course-info .class-name").html("班次：" + params.currentCourse.ClassName);
          $(page).find(".course-info .credit").html("學分：" + params.currentCourse.Credit);
          $(page).find(".course-info .course-teacher").html($(".teacher-list").html());
          $(page).find(".course-info .page-index").html("頁次：" + (index + 1) + " / " + print_pages.length);
          $(page).find(".teacher-sign .subject-code").html("課程編號：" + params.currentCourse.NewSubjectCode + " (" + params.currentCourse.SubjectCode);
          $(page).find(".teacher-sign .subject-name").html("科目名稱：" + params.currentCourse.SubjectName);
          $(page).find(".teacher-sign .class-name").html("班次：" + params.currentCourse.ClassName);
          $(page).find(".score-detail table tbody").html("");
          for (i = _j = 0; _j < 25; i = ++_j) {
            tr = "";
            if (params.students[index * 50 + i] !== void 0) {
              tr = "<td><div style='width:80px'>" + params.students[index * 50 + i]["Department"] + "</div></td>\n<td><div style='width:20px'>&nbsp;</div></td>\n<td><div style='width:80px'>" + params.students[index * 50 + i]["StudentNumber"] + "</div></td>\n<td><div style='width:100px'>" + params.students[index * 50 + i]["Name"] + "</div></td>";
              if (type === "score") {
                tr += "<td>\n	<div style='width:40px'>" + (params.students[index * 50 + i]["IsCancel"] !== "t" ? params.students[index * 50 + i]["Score"] : "***") + "</div>\n</td>\n<td>\n	<div style='width:60px'>" + (params.students[index * 50 + i]["IsCancel"] !== "t" ? params.students[index * 50 + i]["Remark"] : "已停修") + "</div>\n</td>";
              }
              if (type === "clear") {
                tr += "<td>\n	<div style='width:40px'>" + (params.students[index * 50 + i]["IsCancel"] !== "t" ? "" : "***") + "</div>\n</td>\n<td>\n	<div style='width:60px'>" + (params.students[index * 50 + i]["IsCancel"] !== "t" ? "" : "已停修") + "</div>\n</td>";
              }
            } else {
              tr += "<td><div style='width:80px'>&nbsp;</div></td>\n<td><div style='width:20px'>&nbsp;</div></td>\n<td><div style='width:80px'>&nbsp;</div></td>\n<td><div style='width:100px'>&nbsp;</div></td>\n<td><div style='width:40px'>&nbsp;</div></td>\n<td><div style='width:60px'>&nbsp;</div></td>";
            }
            if (params.students[index * 50 + i + 25] !== void 0) {
              tr += "<td><div style='width:80px'>" + params.students[index * 50 + i + 25]["Department"] + "</div></td>\n<td><div style='width:20px'>&nbsp;</div></td>\n<td><div style='width:80px'>" + params.students[index * 50 + i + 25]["StudentNumber"] + "</div></td>\n<td><div style='width:100px'>" + params.students[index * 50 + i + 25]["Name"] + "</div></td>";
              if (type === "score") {
                tr += "<td>\n	<div style='width:40px'>" + (params.students[index * 50 + i + 25]["IsCancel"] !== "t" ? params.students[index * 50 + i + 25]["Score"] : "***") + "</div>\n</td>\n<td>\n	<div style='width:60px'>" + (params.students[index * 50 + i + 25]["IsCancel"] !== "t" ? params.students[index * 50 + i + 25]["Remark"] : "已停修") + "</div>\n</td>";
              }
              if (type === "clear") {
                tr += "<td>\n	<div style='width:40px'>" + (params.students[index * 50 + i + 25]["IsCancel"] !== "t" ? "" : "***") + "</div>\n</td>\n<td>\n	<div style='width:60px'>" + (params.students[index * 50 + i + 25]["IsCancel"] !== "t" ? "" : "已停修") + "</div>\n</td>";
              }
            } else {
              tr += "<td><div style='width:80px'>&nbsp;</div></td>\n<td><div style='width:20px'>&nbsp;</div></td>\n<td><div style='width:80px'>&nbsp;</div></td>\n<td><div style='width:100px'>&nbsp;</div></td>\n<td><div style='width:40px'>&nbsp;</div></td>\n<td><div style='width:60px'>&nbsp;</div></td>";
            }
            $("<tr>" + tr + "</tr>").appendTo($(page).find(".score-detail table tbody"));
          }
          return print_content.push($(page).html());
        });
        content = print_content.join("<P style='page-break-after:always'>&nbsp;</P>");
        content = "<html>\n	<head>\n		<link type=\"text/css\" rel=\"stylesheet\" href=\"css/scorekit.css\"/>\n	</head>\n	<body>\n		<div style='width:880px;padding:40px 20px'>" + content + "</div>\n	</body>\n</html>";
        doc = window.open('about:blank', '_blank', '');
        doc.document.open();
        doc.document.write(content);
        doc.document.close();
        return doc.focus();
      }
    }
  };

}).call(this);
