// const API_KEY =  // Get yours for free at https://judge0.com/ce or https://judge0.com/extra-ce

var language_to_id = {
  Bash: 46,
  C: 50,
  "C#": 51,
  "C++": 54,
  Java: 62,
  Python: 71,
  Ruby: 72,
};


//this fucntion converts given string into base64 becaue the api requires input value in base64
function encode(str) {
  // console.log("THis is src code", ((encodeURIComponent(str || ""))));
  return btoa(unescape(encodeURIComponent(str || "")));
}


function decode(bytes) {
  var escaped = escape(atob(bytes || ""));
  try {
    return decodeURIComponent(escaped);
  } catch {
    return unescape(escaped);
  }
}

function errorHandler(jqXHR, textStatus, errorThrown) {
  $("#output").val(`${JSON.stringify(jqXHR, null, 4)}`);
  $("#run-btn").prop("disabled", false);
}

function check(token) {
  $("#output").val($("#output").val() + "\n⏬ Checking submission status...");
  //api get req call in which we send the token received from post response
  //we use that token in the api to get our desired output
  $.ajax({
    url: `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true`,
    type: "GET",
    headers: {
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      'x-rapidapi-key': '3ac4e8d029msh47bccdee183f73ap141a34jsn9f62545c15d8'
    },
    success: function (data, textStatus, jqXHR) {
      console.log("This is check data", data);
      //on success we recieve a data json object in which crucial data is status id
      //status id 3 is success rest all are failure of some sort
      if ((data["status"]["id"]) === 1 || data["status"]["id"] === 2) {
        $("#output").val(
          $("#output").val() + "\nℹ️ Status: " + data["status"]["description"]
        );
        setTimeout(function () {
          check(token);
        }, 1000);
      } else {
        //if status id is 1 or 2 then there is a possibility of compile error RZNEC or TLE
        var output = [decode(data["compile_output"]), decode(data["stdout"])]
          .join("\n")
          .trim();
        $("#output").val(
          `${data["status"]["id"] != "3" ? "🔴" : "🟢"} ${
            data["status"]["description"]
          }\n${output}`
        );
        //after we receive the output 
        $("#run-btn").prop("disabled", false);
      }
    },
    //errorHandler function is ued to handle api call errors
    error: errorHandler,
  });

  //after api call is succesfully completed the output text is emitted to all sockets
  setTimeout(function () {
    const text = output.value;
    socket.emit("outmsg", text);
  }, 2500);
}

function run() {
  $("#run-btn").prop("disabled", true);
  $("#output").val("⚙️ Creating submission...");
  let code = codeArea.getValue();
  console.log(code);
  //api post call to judge0 sending encoded input lang id
  //to get token
  $.ajax({
    url: "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false",
    type: "POST",
    contentType: "application/json",
    headers: {
      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
      //this is our api key
      'x-rapidapi-key': '3ac4e8d029msh47bccdee183f73ap141a34jsn9f62545c15d8'
    },
    data: JSON.stringify({
      language_id: language_to_id[$("#select-language").val()],
      source_code: encode(code),
      stdin: encode($("#input").val()),
      expected_output: null,
      redirect_stderr_to_stdout: true,
    }),
    //on success we will recieve another data json object
    //crucial data is token
    success: function (data, textStatus, jqXHR) {
      $("#output").val($("#output").val() + "\n🎉 Submission created.");
      console.log(data);
      setTimeout(function () {
        check(data["token"]);
      }, 2000);
    },
    error: errorHandler,
  });

  const text = output.value;
  socket.emit("outmsg", text);


}

$("body").keydown(function (e) {
  if (e.ctrlKey && e.keyCode == 13) {
    run();
  }
});

$("textarea").keydown(function (e) {
  if (e.keyCode == 9) {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    var append = "    ";
    $(this).val(
      $(this).val().substring(0, start) + append + $(this).val().substring(end)
    );

    this.selectionStart = this.selectionEnd = start + append.length;
  }
});

$("#source").focus();