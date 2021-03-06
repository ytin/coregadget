jQuery(function () {
    SurveyManger.on_init();

    // 點選課程評鑑
    $('#tab_survey_list').on('click', 'a[data-index]', function() {
        var index = $(this).attr('data-index');
        SurveyManger.load_form(index);

        $('#tab_survey_list').hide();
        $('#tab_form').show();
    });

    // 評鑑表單的按鈕事件
    $('#tab_form')
        .hide().find('[data-type=preview]').hide().end()
        .on('click', '[data-action=form_cancel]', function() { formCancel(); })
        .on('click', '[data-action=preview_cancel]', function() { previewCancel(); })
        .on('click', 'button[data-action=preview]', function() {
            $('#mainMsg').html('');
            if ($('#form1').valid()) {
                // 驗證通過，預覽
                previewClick();
            } else {
                $('tr.error:first').find('textarea, input').first().focus();
                $('body').scrollTop(0);
                if ($('tr.error span.my-star').length > 0) { alert('您還有【必填】題目未填寫，請填答完整後再送出'); }
                SurveyManger.msg('#mainMsg', '', '資料驗證失敗，請重新檢查！');
            }
        })
        .on('click', 'button[data-action=temp]', function() {
            $('#mainMsg').html('');
            SurveyManger.saveReply('0', getReply2Obj());
        });

    $('#save-data').click(function() {
        $("#save-data").button('loading'); // 按鈕設為處理中
        SurveyManger.saveReply('1', getReply2Obj());
    });

    //#region 將結果轉成物件
    var getReply2Obj = function() {
        var all_qid = [];
        var reply = {
            'Answers': {
                'Question': []
            }
        };
        $('#tab_form td[data-qid]').each(function(index, val) {
            var tmp;
            var that_qid = $(this).attr('data-qid') || '';
            var has_qid = $.inArray(that_qid, all_qid);
            if (has_qid === -1) {
                reply.Answers.Question.push({
                    '@'          : ['QuestionID'],
                    'QuestionID' : that_qid,
                    'Answer'     : []
                });
                all_qid.push(that_qid);
                tmp = reply.Answers.Question[reply.Answers.Question.length - 1];
            } else {
                tmp = reply.Answers.Question[has_qid];
            }
            $(this).each(function(index, val) {
                $(val).find('input[data-caseid]:checked, textarea').each(function(index, item) {
                    tmp.Answer.push({
                        '@text'  : $(item).attr('data-title') || '',
                        '@'      : ['CaseID','Score'],
                        'CaseID' : $(item).attr('data-caseid') || '',
                        'Score'  : $(item).val() || ''
                    });
                });
            });
        });
        return reply;
    };
    //#endregion

    //#region 預覽
    var previewClick = function() {
        $('#tab_form')
            .find('.my-preview-remove').hide().end()
            .find('[data-type=form]').hide().end()
            .find('[data-type=preview]').show().end()
            .find('form')
            .find('input:radio').each(function(){
                $(this).hide();
                if (!this.checked) {
                    $(this).parent('label').hide();
                }
            }).end()
            .find('input:checkbox').each(function(){
                $(this).hide();
                if (!this.checked) {
                    $(this).parent('label').hide();
                }
            }).end()
            .find('textarea').hide().each(function(){
                $(this).after('<span data-type="preview">' + $('<div/>').text($(this).val()).html().replace(/\n/g, '<br />') + '</span>');
            });
    };
    //#endregion

    //#region 返回編輯
    var previewCancel = function() {
        $('#mainMsg').html('');
        $('#tab_form')
            .find('.my-preview-remove').show().end()
            .find('[data-type=form]').show().end()
            .find('[data-type=preview]').hide().end()
            .find('form')
            .find('label, input:radio').each(function(){
                $(this).show();
            }).end()
            .find('label, input:checkbox').each(function(){
                $(this).show();
            }).end()
            .find('textarea').show().end()
            .find('span[data-type=preview]').remove();
    };
    //#endregion

    //#region 返回評鑑列表
    var formCancel = function() {
        SurveyManger.reload_list();
        $('#mainMsg').html('');
        $('#tab_form').hide();
        $('#tab_survey_list').show();
    };
    //#endregion

    //#region 驗證提示樣式設定
    $.validator.setDefaults({
        debug: true, // 為 true 時不會 submit
        errorElement: "span", //錯誤時使用元素
        errorClass: "help-inline", //錯誤時使用樣式
        highlight: function(element) {
            // 將未通過驗證的表單元素設置高亮度
            $(element).parentsUntil('tr').parent('tr').addClass("error");
        },
        unhighlight: function(element) {
            // 與 highlight 相反
            $(element).parentsUntil('tr').parent('tr').removeClass("error");
        },
        errorPlacement: function (error, element) {
            // 錯誤標籤的顯示位置
            if (element.is(':radio') || element.is(':checkbox')) {
                error.appendTo(element.closest('td'));
            }
            else {
                error.insertAfter(element);
            }
        }
    });
    //#endregion
});


var SurveyManger = function() {
    var _connection = gadget.getContract("emba.survey.student"),
        _student_name,
        _school_year,
        _semester,
        _surveylist = [],
        _courses = [],
        _questions = [],
        _curr_survey,
        _conn_log = gadget.getContract("emba.student"),
        _textarea_maxLength = 500,
        _teaching_evaluation_precautions = '';

    //#region 取得學年度學期
    var getCurrentSemester = function() {
        _connection.send({
            service: "_.GetCurrentSemester",
            body: '',
            result: function (response, error, http) {
                if (error !== null) {
                    set_error_message('#mainMsg', 'GetCurrentSemester', error);
                } else {
                    if (response.Current) {
                        $(response.Current).each(function(index, item) {
                            _school_year = item.SchoolYear;
                            _semester = item.Semester;
                        });
                    }
                    initialize();
                }
            }
        });
    };
    //#endregion

    //#region 取得評鑑注意事項
    var getPrecautions = function() {
        _connection.send({
            service: "_.GetCSConfiguration",
            body: '<Request><Condition><ConfName>teaching_evaluation_precautions</ConfName></Condition></Request>',
            result: function (response, error, http) {
                if (error !== null) {
                    set_error_message('#mainMsg', 'GetCSConfiguration', error);
                } else {
                    // <Response>
                    //     <Configuration>
                    //         <ConfName>teaching_evaluation_precautions</ConfName>
                    //         <ConfContent>
                    //             <![CDATA['由desktop提供之樣版內容']]></ConfContent>
                    //     </Configuration>
                    // </Response>

                    if (response.Response && response.Response.Configuration) {
                        $(response.Response.Configuration).each(function(index, item) {
                            _teaching_evaluation_precautions = item.ConfContent;
                            $('#teaching_evaluation_precautions').html(_teaching_evaluation_precautions);
                        });
                    }
                }
            }
        });
    };

    //#endregion

    //#region 取得個人基本資料
    var getMyInfo = function() {
        _connection.send({
            service: "_.GetMyInfo",
            body: '',
            result: function (response, error, http) {
                if (error !== null) {
                    set_error_message('#mainMsg', 'GetMyInfo', error);
                } else {
                    if (response.StudentInfo) {
                        $(response.StudentInfo).each(function(index, item) {
                            _student_name = item.StudentName;
                        });
                    }
                }
            }
        });
    };
    //#endregion

    //#region 填寫狀態
    var getStatus = function(status, index) {
        switch(status) {
            case '0':
                return '<td><a href="javascript: void(0);" class="btn btn-warning" data-index="' + index + '">暫存</a></td>';
                break;
            case '1':
                return '<td><span class="btn disabled">已完成</span></td>';
                break;
            default:
                return '<td><a href="javascript: void(0);" class="btn btn-danger" data-index="' + index + '">開始填寫</a></td>';
        }
    };
    //#endregion

    //#region 取得問卷
    var getSurveyList = function(schoolyear, semester) {
        _connection.send({
            service: "_.GetSurvey",
            body: {
                Request: {
                    Condition: {
                        SchoolYear: schoolyear || '',
                        Semester: semester || ''
                    }
                }
            },
            result: function (response, error, http) {
                if (error !== null) {
                    set_error_message('#mainMsg', 'GetSurvey', error);
                } else {
                    if (response.Response && response.Response.Survey) {
                        _surveylist = myHandleArray(response.Response.Survey);
                        showSurveyList();
                    } else {
                        $('#tab_survey_list tbody').html('<tr><td colspan="4">目前無資料</td></tr>');
                    }
                }
            }
        });
    };
    //#endregion

    //#region 顯示問卷列表
    var showSurveyList = function() {
        _connection.send({
            service: "_.GetCurrentDateTime",
            body: {},
            result: function (response, error, http) {
                if (error !== null) {
                    set_error_message('#mainMsg', 'GetCurrentDateTime', error);
                } else {
                    var tmp_Date  = new Date(response.DateTime);
                    var items = [];
                    $(_surveylist).each(function(index, item) {
                        // 填寫評鑑鈕
                        var status_html;
                        if (item.ReplyStatus !== '1') {
                            if (item.OpeningTime && item.EndTme) {
                                var Startdate = new Date(item.OpeningTime);
                                var Enddate   = new Date(item.EndTme);

                                if (Startdate <= tmp_Date && Enddate >= tmp_Date) {
                                    status_html = getStatus(item.ReplyStatus, index);
                                } else if (Enddate < tmp_Date) {
                                    status_html = '<td>已過期</td>';
                                } else {
                                    status_html = '<td>尚未開放</td>';
                                }
                            }
                        } else {
                            status_html = getStatus(item.ReplyStatus, index);
                        }

                        items.push(
                            '<tr>' +
                            '  <td>' + (item.CourseName || '') + '</td>' +
                            '  <td>' + (item.TeacherName || '') + '</td>' +
                            '  <td>' + (item.OpeningTime || '') + ' ~ ' + (item.EndTme || '') +'</td>' +
                            status_html +
                            '</tr>'
                        );
                    });
                    if (items.length > 0) {
                        $('#tab_survey_list tbody').html(items.join(''));
                    } else {
                        $('#tab_survey_list tbody').html('<tr><td colspan="4">目前無資料</td></tr>');
                    }
                }
            }
        });
    };
    //#endregion

    //#region 取得課程資訊
    var getCourseInfo = function(course_id) {
        if (course_id) {
            if (!_courses[course_id]) {
                _courses[course_id] = [];
                _connection.send({
                    service: "_.GetCourseInfo",
                    body: {
                        Request: {
                            Condition: {
                                CourseID: course_id
                            }
                        }
                    },
                    result: function (response, error, http) {
                        if (error !== null) {
                            set_error_message('#mainMsg', 'GetCourseInfo', error);
                        } else {
                            if (response.Response && response.Response.Course) {
                                _courses[course_id] = response.Response.Course;
                            }
                            show_FormCurseInfo(_courses[course_id]);
                        }
                    }
                });
            } else {
                show_FormCurseInfo(_courses[course_id]);
            }
        }
    };
    //#endregion

    //#region 取得題目及選項及個案
    var show_question = function() {
        $('#tab_form tbody[data-type=questions]').html('');
        $('#tab_form tbody.my-tbody-hierarchy').remove();

        var hierarchy = [];

        if (_curr_survey) {
            var course_id = _curr_survey.CourseID,
                teacher_id = _curr_survey.TeacherID,
                survey_id = _curr_survey.SurveyID,
                reply_answer =  _curr_survey.ReplyAnswer,
                reply_status = _curr_survey.ReplyStatus,
                req_q, req_c, that_questions, that_case;

            //#region 顯示題目
            var processQuestion = function() {
                if (req_q && req_c) {
                    var down_question = [], top_question = [];

                    //#region 選項
                    var get_option = function(item, caseid) {
                        var validate_css = (item.IsRequired === 't' ? 'required' : ''); // 是否必填，驗證的plugin用
                        var unique = 'q' + (item.QuestionID || '') + (caseid || ''); // 組合題號、個案編號為唯一值，填值用
                        var tmp_html = [];
                        tmp_html.push('<td data-qid="' + (item.QuestionID || '') + '">');

                        switch (item.Type) {
                            case '單選題':
                                if (item.Options && item.Options.Option) {
                                    $(item.Options.Option).each(function(order, value) {
                                        tmp_html.push(
                                            '<label class="radio">' +
                                            '<input type="radio" name="' + unique + '" class="' + validate_css + '"' +
                                            ' data-caseid="' + caseid + '"' +
                                            ' data-title="' + (value.OptionTitle || '') + '"' +
                                            ' value="' + (value.OptionOrder || '') + '">' + (value.OptionTitle || '') +
                                            '</label>'
                                        );
                                    });
                                }
                                break;
                            case '問答題':
                                tmp_html.push('<textarea name="' + unique + '" rows="5" class=" {extMaxLength: ' + _textarea_maxLength + '} ' + validate_css + ' input-block-level"' +
                                    ' data-caseid="' + caseid + '"' +
                                    ' data-maxLength="' + _textarea_maxLength + '"' +
                                    '></textarea>' +
                                    '<div class="my-note-text my-preview-remove">(請勿超過' + _textarea_maxLength + '字元)</div>');
                                break;
                            case '複選題':
                                if (item.Options && item.Options.Option) {
                                    $(item.Options.Option).each(function(order, value) {
                                        tmp_html.push(
                                            '<label class="checkbox">' +
                                            '<input type="checkbox" name="' + unique + '" class="' + validate_css + '"' +
                                            ' data-caseid="' + caseid + '"' +
                                            ' data-title="' + (value.OptionTitle || '') + '"' +
                                            ' value="' + (value.OptionOrder || '') + '">' + (value.OptionTitle || '') +
                                            '</label>'
                                        );
                                    });
                                }
                                break;
                        }

                        tmp_html.push('</td>');
                        return tmp_html.join('');
                    };
                    //#endregion

                    if (that_questions.Hierarchy) {
                        if (that_questions.Hierarchy.length > 0) {
                            $(that_questions.Hierarchy).each(function(index, hierarchy) {
                                var question_html = '';
                                var hierarchy_idx = '';

                                if (hierarchy.HierarchyOrder) {
                                    hierarchy_idx = conver2Chinese.getResult(hierarchy.HierarchyOrder) + '、 ' + (hierarchy.HierarchyTitle || '');
                                }

                                question_html = (hierarchy_idx) ? '<tr><th colspan="2" class="my-hierarchy">' + hierarchy_idx + '</th></tr>' : '';

                                if (hierarchy.Question) {
                                    $(hierarchy.Question).each(function(index, item) {
                                        var question_idx = (item.QuestionOrder || '') + '.';

                                        //#region 題目
                                        if (item.IsCase === 't') {
                                            // 個案題
                                            question_html += '<tr class="my-iscase"><td colspan="2"><div class="my-question-container">' +
                                                '<div class="my-question-number">' +
                                                (item.IsRequired === 't' ? '<span class="text-error my-star">*</span>' : '<span class="my-star">&nbsp;&nbsp;&nbsp;</span>') +
                                                question_idx +
                                                '</div>' +
                                                '<div class="my-question-title">' + (item.QuestionTitle || '') + '</div></div></td></tr>';

                                            $(that_case).each(function(index, data) {
                                                var case_idx = (item.QuestionOrder || '') + '-' + (index+1) + '.';
                                                question_html += '<tr class="my-iscase">' +
                                                    '<td class="my-casename">' +
                                                    '<div class="my-question-container">' +
                                                    '<div class="my-question-number">' + case_idx + '</div>' +
                                                    '<div class="my-question-title">' + (data.CaseName || '') + '</div></div></td>' +
                                                    get_option(item, data.CaseID) + '</tr>';
                                            });
                                        } else {
                                            // 其他
                                            question_html += '<tr><td><div class="my-question-container">' +
                                                '<div class="my-question-number">' +
                                                (item.IsRequired === 't' ? '<span class="text-error my-star">*</span>' : '<span class="my-star">&nbsp;&nbsp;&nbsp;</span>') +
                                                question_idx +
                                                '</div>' +
                                                '<div class="my-question-title">' + (item.QuestionTitle || '') + '</div></div></td>' +
                                                get_option(item, '') +
                                                '</tr>';
                                        }
                                        //#endregion
                                    });
                                }

                                //#region 完整的題目
                                if (hierarchy.HierarchyOrder) {
                                    down_question.push('<tbody class="my-tbody-hierarchy">' + question_html + '</tbody>');
                                } else {
                                    // 沒有標題的置頂
                                    top_question.push('<tbody class="my-tbody-hierarchy">' + question_html + '</tbody>');
                                }
                                //#endregion
                            });

                            $('#tab_form tbody[data-type=questions]').after(top_question.join('') + down_question.join(''));
                            var container = $('#tab_form tbody.my-tbody-hierarchy');

                            //#region 設定之前的作答情況
                            if (reply_answer.Answers && reply_answer.Answers.Question) {
                                $(reply_answer.Answers.Question).each(function(key, answer) {
                                    var caseid, option,
                                        qid = answer.QuestionID || '';
                                    $(answer.Answer).each(function(a, b) {
                                        caseid = b.CaseID || '';
                                        option = b['@text'] || '';
                                        score = b.Score || '';
                                        $('input[name=q' + qid + caseid + ']', container).filter('[value="' + score + '"]').prop('checked', true);
                                        $('textarea[name=q' + qid + caseid + ']', container).val(score);
                                    });
                                });
                            }
                            //#endregion
                        } else {
                            $('#tab_form tbody[data-type=questions]').html('<tr><td colspan="2">目前無題目</td></tr>');
                        }
                    } else {
                        $('#tab_form tbody[data-type=questions]').html('<tr><td colspan="2">目前無題目</td></tr>');
                    }
                }
                $('#tab_form').find('[data-type=form]').show();
            };
            //#endregion

            if (reply_status === '1') {
                // 已送出
                $('#tab_form tbody[data-type=questions]').html('<tr><td colspan="2">本評鑑已作答<br/><button type="button" class="btn" data-action="form_cancel">返回</button></td></tr>');
            } else {
                if (survey_id && course_id && teacher_id) {
                    //#region 取得個案
                    _connection.send({
                        service: "_.GetCourseTeacherCase",
                        body: {
                            Request: {
                                Condition: {
                                    CourseID: course_id,
                                    TeacherID: teacher_id
                                },
                                Order: {
                                    CaseID: 'asc'
                                }
                            }
                        },
                        result: function (response, error, http) {
                            if (error !== null) {
                                set_error_message('#mainMsg', 'GetCourseTeacherCase', error);
                            } else {
                                that_case = [];
                                if (response.Response && response.Response.Case) {
                                    $(response.Response.Case).each(function(index, item) {
                                        that_case.push({
                                            CaseID : item.CaseID,
                                            CaseName : item.CaseName
                                        });
                                    });
                                }
                                req_c = true;
                                processQuestion();
                            }
                        }
                    });
                    //#endregion

                    //#region 取得題目及選項
                    if (!_questions[survey_id]) {
                        _questions[survey_id] = [];
                        _connection.send({
                            service: "_.GetQuestion",
                            body: {
                                Request: {
                                    Condition: {
                                        SurveyID: survey_id
                                    },
                                    Order: {
                                        QuestionOrder: 'asc', OptionOrder: 'asc'
                                    }
                                }
                            },
                            result: function (response, error, http) {
                                if (error !== null) {
                                    set_error_message('#mainMsg', 'GetQuestion', error);
                                } else {
                                    _questions[survey_id] = that_questions = response.Questions;
                                    req_q = true;
                                    processQuestion();
                                }
                            }
                        });
                    } else {
                        req_q = true;
                        that_questions = _questions[survey_id];
                        processQuestion();
                    }
                    //#endregion

                }
            }
        }
    };
    //#endregion

    //#region 錯誤訊息
    var set_error_message = function(select_str, serviceName, error) {
        if (serviceName) {
            var tmp_msg = '<i class="icon-white icon-info-sign my-err-info"></i><strong>呼叫服務失敗或網路異常，請稍候重試!</strong>(' + serviceName + ')';
            if (error !== null) {
                if (error.dsaError) {
                    if (error.dsaError.status === "504") {
                        switch (error.dsaError.message) {
                            case '501':
                                tmp_msg = '<strong>很抱歉，您無存取資料權限！</strong>';
                                break;
                            case '502':
                                tmp_msg = '<strong>很抱歉，目前未開放！</strong>';
                                break;
                            default:
                                tmp_msg = '<strong>' + error.dsaError.message + '</strong>';
                        }
                    } else if (error.dsaError.message) {
                        tmp_msg = error.dsaError.message;
                    }
                } else if (error.loginError.message) {
                    tmp_msg = error.loginError.message;
                } else if (error.message) {
                    tmp_msg = error.message;
                }
                $(select_str).html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  " + tmp_msg + "\n</div>");
                $('.my-err-info').click(function(){alert('請拍下此圖，並與客服人員連絡，謝謝您。\n' + JSON.stringify(error, null, 2))});
            }
        } else {
            $(select_str).html("<div class='alert alert-error'>\n  <button class='close' data-dismiss='alert'>×</button>\n  " + error + "\n</div>");
        }
    };
    //#endregion

    //#region 顯示初始畫面
    var initialize = function() {
        if (_school_year && _semester) {
            $('#tabName').html(_school_year + '學年度' + (_semester === '0' ? '夏季學期' : '第' + _semester + '學期'));
            getSurveyList(_school_year, _semester);
        }
    };
    //#endregion

    //#region 顯示填寫畫面的課程資訊
    var show_FormCurseInfo = function(course) {
        var teacher_name, description, items = [];
        teacher_name = _curr_survey.TeacherName;
        description = _curr_survey.Description;

        items.push(
            '<tr class="my-table">' +
                '<td>' + (course.NewSubjectCode || '') + '</td>' +
                '<td>' + (course.CourseName || '') + '</td>' +
                '<td>' + (teacher_name || '') + '</td>' +
                '<td>' + (course.StudentCount || '') + '</td>' +
            '</tr>'
        );
        $('#tab_form tbody[data-type=title]').html(items.join(''));
        $('#tab_form tbody[data-type=note] td').html(description || '&nbsp;');
    };
    //#endregion

    //#region 轉換物件為陣列
    var myHandleArray = function(obj) {
        var result;

        result = void 0;
        if (!$.isArray(obj)) {
            result = [];
            if (obj) {
                result.push(obj);
            }
        } else {
            result = obj;
        }
        return result;
    };
    //#endregion

    //#region 數字轉國字
    var intToChineseNumberString = function (useLowerType) {
        var obj = this;//待回傳的物件
        var numLower = Array('○', '一', '二', '三', '四', '五', '六', '七', '八', '九');//小寫中文
        var numUpper = Array('零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖');//大寫中文
        var numTarget = useLowerType ? numLower : numUpper;//指定要用哪一個中文（大小寫）
        var numLowerUnit1 = Array('','十','百','千');//小寫中文小單位
        var numLowerUnit2 = Array('', '拾', '佰', '仟');//大寫中文小單位
        var numLowerTarget = useLowerType ? numLowerUnit1 : numLowerUnit2;//指定要用哪一個中文（小單位）
        var numLowerUnitLength = 4;//小單位長度
        var numLargeUnit = Array('', '萬', '億', '兆', '京', '垓', '秭', '穰', '溝', '澗', '正', '載', '極');//中文大單位
        var numNegative = "-";//負值
        //判斷是否為數值型態
        obj.checkIsNumber = function (number) {
            return !isNaN(parseInt(number));
        }
        obj.getResult = function (number) {
            //如果不是數值，則擲出例外
            if (!this.checkIsNumber(number)) {
                Error("輸入的形態不是Number");
                throw new Error("輸入的形態不是Number");
            }
            //如果是零，則直接輸出
            else if (number == 0) return numTarget[0];
            //轉成字串(使用絕對值避免處理負號)
            var numberString = String(Math.abs(number));
            //準備輸出的字串
            var output = "";
            //小單位(四位數)的傳回值(傳入數字字串)
            var getCurrentPart = function (numString) {
                //拆解成陣列
                numString = numString.split("");
                //預設回傳結果
                var result = "";
                //是否輸出過1-9
                var isLastNumberNonZero = false;
                //從後往前掃
                //1011一千○一十一
                for (var index = numString.length - 1; index >= 0 ; index--) {
                    //目前位數
                    var currentDigit = numString.length - index;
                    //目前的數字
                    var currentNumber = numString[index] - '0';
                    //上一個位數為非0
                    //剛開始為false(沒有上一個位數)，之後會偵測上一個位數(之前的小位數)是否為非0
                    isLastNumberNonZero = ((index + 1) == numString.length) ? false : (numString[index + 1] - '0' > 0);
                    //剛開始遇到零不處理，除非有之後遇到1-9
                    if (isLastNumberNonZero || currentNumber > 0)
                        result = numTarget[currentNumber]//數字
                            + (currentNumber > 0 ? numLowerTarget[(currentDigit - 1) % numLowerUnitLength] : "")//小單位(個十百千) 大於0才會輸出
                            + result;//上一個位數
                }
                return result;
            };
            //剛開始小單位長度(前面多出的部份)，Ex 10000，多出的部份為1
            var initialPartLegth = numberString.length % numLowerUnitLength;
            if (initialPartLegth > 0) {
                output = getCurrentPart(numberString.substr(0, initialPartLegth)) + numLargeUnit[Math.floor(numberString.length / 4)];
            }
            //之後每次掃四個位數
            for (var i = initialPartLegth; i < numberString.length; i += numLowerUnitLength) {
                var partResult = getCurrentPart(numberString.substr(i, numLowerUnitLength));
                output += partResult + (partResult!=""? numLargeUnit[(numberString.length - i) / 4 - 1] : "");
            }
            //回傳時如有負值，則加上-
            return (number < 0 ? numNegative : "") + output;
        }
        //回傳物件
        return  obj;
    }
    var conver2Chinese = new intToChineseNumberString(true);
    //#endregion

    $.validator.addMethod('extMaxLength', function (value, element) {
        var maxlen = parseInt($(element).attr('data-maxLength'));
        if (maxlen > 0) {
            var remaining = (maxlen - (parseInt($(element).val().replace(/(\r\n|\n|\r)/gm, '').length)));
            if (remaining < 0) {
                return false;
            }
        }

        return true;
    });


    //#region 回傳值
    return {
        msg: function(select_str, serviceName, error) {
            set_error_message(select_str, serviceName, error);
        }
        ,on_init: function() {
            getPrecautions();
            getCurrentSemester();
            getMyInfo();
            initialize();
        }
        ,load_form: function(index) {
            $('#tab_form').find('[data-type=form], [data-type=preview]').hide()
            var course_id;
            _curr_survey = _surveylist[index];
            if (_curr_survey) {
                _curr_survey.idx = index;
                course_id = _curr_survey.CourseID;
                getCourseInfo(course_id);
                show_question();
            }
        }
        //#region 儲存評鑑結果
        ,saveReply: function(status, answer) {
            if (_curr_survey) {
                _connection.send({
                    service: "_.SetReply",
                    body: {
                        'Request':{
                            'Reply':{
                                'Field':{
                                    'Answer': answer || '',
                                    'Status': status || ''
                                },
                                'Condition':{
                                    'CourseID'  : _curr_survey.CourseID || '',
                                    'SurveyID'  : _curr_survey.SurveyID || '',
                                    'TeacherID' : _curr_survey.TeacherID || ''
                                }
                            }
                        }
                    },
                    result: function (response, error, http) {
                        if (error !== null) {
                            $('body').scrollTop(0);
                            set_error_message('#mainMsg', 'SetReply', error);
                            $("#save-data").button("reset");
                        } else {
                            //  問卷填寫內容異動，通知「歷史填答記錄」更新頁面
                            SurveyChanged_Handler.SurveyChanged();

                            $('body').scrollTop(0);
                            _curr_survey.ReplyAnswer = answer;
                            _curr_survey.ReplyStatus = status;
                            $('#tab_survey_list td').has('a[data-index=' + _curr_survey.idx + ']').after(getStatus(status, _curr_survey.idx)).remove();
                            $("#save-data").button("reset");
                            $('#mainMsg').html("<div class='alert alert-success'>\n  儲存成功！\n</div>");
                            setTimeout("$('#mainMsg').html('')", 1500);
                            showSurveyList();
                            $('#tab_form').hide();
                            $('#tab_survey_list').show();

                            //#region 儲存log
                            var status_name = (status === '1') ? '儲存' : '暫存';
                            var log_add_content = [];
                            log_add_content.push(
                                '學生「' + (_student_name || '') + '」' +
                                status_name +
                                '「' + _school_year + '學年度' + (_semester === '0' ? '夏季學期' : '第' + _semester + '學期') + '」' +
                                ' 課程「' + (_curr_survey.CourseName || '') + '」' +
                                ' 老師「' + (_curr_survey.TeacherName || '') + '」' +
                                '的教學評鑑'
                            );

                            $('#tab_form tbody[data-type=questions] tr').each(function() {
                                log_add_content.push('「' + ($(this).find('td:eq(0), th:eq(0)').text() || '') + '」');
                                $(this).find('td:eq(1) input[data-caseid]:checked, textarea').each(function(index, item) {
                                    log_add_content.push($(item).val() || '');
                                });
                            });

                            gadget.getContract("emba.student").send({
                                service: "public.AddLog",
                                body: "<Request>\n  <Log>\n     <Actor>" + _conn_log.getUserInfo().UserName + "</Actor>\n        <ActionType>" + status_name + "</ActionType>\n       <Action>" + status_name + "評鑑</Action>\n       <TargetCategory>student</TargetCategory>\n      <ClientInfo><ClientInfo></ClientInfo></ClientInfo>\n        <ActionBy>ischool web 教學評鑑小工具</ActionBy>\n      <Description>" + log_add_content.join('\n') + "</Description>\n    </Log>\n</Request>"
                            });
                            //#endregion
                        }
                    }
                });
            }
        }
        //#endregion
        ,reload_list: function() {
            showSurveyList();
        }
    };
    //#endregion
}();