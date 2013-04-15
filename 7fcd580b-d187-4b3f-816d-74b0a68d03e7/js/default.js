// Generated by CoffeeScript 1.3.3
(function() {
  var bind_myinfo, bind_payment;

  $(function() {
    bind_myinfo();
    return bind_payment();
  });

  bind_myinfo = function() {
    return gadget.getContract("emba.student").send({
      service: "default.GetMyInfo",
      body: "",
      result: function(response, error, http) {
        var myInfo;
        if (response.Result != null) {
          myInfo = response.Result;
          if (myInfo.Status === "在學" || myInfo.Status === "休學") {
            return $("#payment #payment-message").addClass("hide");
          }
        }
      }
    });
  };

  bind_payment = function() {
    return gadget.getContract("emba.student").send({
      service: "default.GetPaymentHistory",
      body: "",
      result: function(response, error, http) {
        var items;
        items = [];
        if (response.Result != null) {
          $(response.Result.PaymentHistory).each(function(index, item) {
            if (item.IsPaied === "1") {
              return items.push("<tr>\n    <td>" + item.SchoolYear + "</td>\n    <td>" + (item.Semester === "0" ? "暑假" : "第 " + item.Semester + " 學期") + "</td>\n    <td>已繳費</td>\n    <td>" + (item.ModifiedDate !== "" ? item.ModifiedDate.substr(0, 10) : "") + "</td>\n</tr>");
            }
          });
        }
        return $("#payment #payment-detail tbody").html((items.length === 0 ? '<tr><td colspan="4">無資料</td></tr>' : items.join("")));
      }
    });
  };

}).call(this);
