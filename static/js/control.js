
  // className strings
  var class_disconnect = "participant_action fa fa-eject fa-fw red";
  var class_mute_on = "participant_action fa fa-microphone-slash fa-fw red";
  var class_mute_off = "participant_action fa fa-microphone fa-fw green";
  var class_hold_on = "participant_action fa fa-play fa-fw";
  var class_hold_off = "participant_action fa fa-pause fa-fw";
  var class_lock_on = "participant_action fa fa-lock fa-fw red";
  var class_spotlight_on = "participant_action fa fa-star fa-fw yellow";
  var class_spotlight_off = "participant_action fa fa-star-o fa-fw yellow";
  var class_see_presentation_allowed = "participant_action fa fa-bar-chart fa-fw green";
  var class_see_presentation_denied = "participant_action fa fa-bar-chart fa-fw red";
  var class_overlay = "participant_action fa fa-font fa-fw";
  var class_conference_lock_on = "conference_action fa fa-lock fa-fw red";
  var class_conference_lock_off = "conference_action fa fa-unlock fa-fw green";
  var class_conference_guests_mute_on = "conference_action fa fa-microphone-slash fa-fw red";
  var class_conference_guests_mute_off = "conference_action fa fa-microphone fa-fw green";
  var class_conference_disconnect_all = "conference_action fa fa-eject fa-fw red";
  var class_role_chair = "participant_action fa fa-commenting-o fa-fw";
  var class_role_guest = "participant_action fa fa-comment-o fa-fw";
  var class_role_chair_selected = "participant_action fa fa-commenting fa-fw";
  var class_role_guest_selected = "participant_action fa fa-comment fa-fw";


  function DumpObject(obj)
  {
    var od = new Object;
    var result = "";
    var len = 0;

    for (var property in obj)
    {
      var value = obj[property];
      if (typeof value == 'string')
        value = "'" + value + "'";
      else if (typeof value == 'object')
      {
        if (value instanceof Array)
        {
          value = "[ " + value + " ]";
        }
        else
        {
          var ood = DumpObject(value);
          value = "{ " + ood.dump + " }";
        }
      }
      result += "'" + property + "' : " + value + ", ";
      len++;
    }
    od.dump = result.replace(/, $/, "");
    od.len = len;

    return od;
  }

  function getURLParameter(name) {
    // Only find single (first) entry of name for now
    var value = null;
    var regex = new RegExp('[?|&]' + name + '(=([^&;]+?)(&|#|;|$))?').exec(location.search);
    if (regex) {
        value = regex[2] || name;
    }
    if (value) {
        return decodeURIComponent(value);
    } else {
        return null;
    }
  }

  function action_request_args() {
      var conference_url = getURLParameter('conference');
      if (conference_url) {
          document.getElementById("conference").value = conference_url;
      }
      var worker = getURLParameter('worker');
      if (worker) {
          document.getElementById("worker").value = worker;
      }
      var pin_url = getURLParameter('pin');
      if (pin_url) {
          document.getElementById("pin").value = pin_url;
      }
      var extension = getURLParameter('extension');
      if (extension) {
          document.getElementById("two_stage_dial_ext").value = extension;
      }
      var name_url = getURLParameter('name');
      if (name_url) {
          document.getElementById("display_name").value = name_url;
      }
      if (conference_url && worker) {
          var join_url = getURLParameter('join');
          if (join_url) {
              user.join();
              var dial = getURLParameter('dial');
              if (dial) {
                  var dial_url = getURLParameter('dial_uri');
                  var dial_protocol = getURLParameter('dial_protocol');
                  user.action_dial(dial_protocol, conference_url, conference_url, dial_url, 'host');
              }
          }
      }
  }

  function update_audience() {
      // Audience drop down updated
      // If hosts is selected, make sure
      // auto is removed from plus_n
      // and show guest view params
      // and add it back if everyone selected
      // and hide guest view params
      var auto_option = document.getElementById("auto_option");
      var plus_n_element = document.getElementById("plusn");
      var audience_element = document.getElementById("audience");
      var guestlayout_element = document.getElementById("guestlayout");
      if (audience_element.value == 'hosts') {
          auto_option.disabled = true;
          if (plus_n_element.value == 'auto') {
              plus_n_element.value = 'off';
          }
          guestlayout_element.className = "";
      } else {
          auto_option.disabled = false;
          guestlayout_element.className = "hide";
      }
  }
  function Participant(participant_data) {
      this.uuid = participant_data["uuid"];
      this.speaking = false;
      this.element_root = document.createElement("li");
      this.element_root.className = "roster_entry";

      this.uri = participant_data["uri"];

      if (participant_data["display_name"] != "") {
          this.uri = this.uri + " - " + participant_data["display_name"];
      }

      if (this.uuid == user.participant_uuid) {
          this.uri = this.uri + " <span class='pexorange'>[this client]</span>";
      }

      this.uri_element = document.createElement("div");
      this.uri_element.className = "participant_uri";
      this.uri_element.innerHTML = this.uri;

      console.log("has_media " + participant_data["has_media"]);
      this.enable_media_buttons = participant_data["has_media"] && (user.role == 'HOST');

      // Add layout check
      this.layout = document.createElement("input");
      this.layout.setAttribute('type', 'checkbox');
      this.element_root.appendChild(this.layout);

      // Add avatar
      this.avatar = document.createElement("img");
      this.avatar.src = "https://" + user.node + "/api/client/v2/conferences/" + user.conference + "/participants/" + this.uuid + "/avatar.jpg?width=80&height=80&token=" + user.token;
      this.avatar.onerror = this.avatar_error.bind(this);
      this.avatar.height = 40;
      this.avatar.addEventListener('click', this.avatar_click.bind(this), false);
      this.element_root.appendChild(this.avatar);

      // Add protocol
      if (participant_data["protocol"] != undefined) {
          this.protocol_element = document.createElement("div");
          this.protocol_element.className = "participant_uri";
          this.protocol_element.innerHTML = "<b>" + participant_data["protocol"] + "</b>";
          this.element_root.appendChild(this.protocol_element);
      }

      // Add role host/guest
      this.chair_role_element = document.createElement("div");
      if (participant_data["role"] === "chair") {
          this.chair_role_element.className = class_role_chair_selected;
      } else {
          this.chair_role_element.className = class_role_chair;
      }
      this.chair_role_element.addEventListener('click', this.chair_role.bind(this), false);
      this.element_root.appendChild(this.chair_role_element);
      this.guest_role_element = document.createElement("div");
      if (participant_data["role"] === "guest") {
          this.guest_role_element.className = class_role_guest_selected;
      } else {
          this.guest_role_element.className = class_role_guest;
      }
      this.guest_role_element.addEventListener('click', this.guest_role.bind(this), false);
      this.element_root.appendChild(this.guest_role_element);


      // Add spotlight button/status
      this.spotlight_element = document.createElement("div");
      this.spotlight_state = participant_data["spotlight"] != 0;
      if (this.spotlight_state) {
          this.spotlight_element.className = class_spotlight_on;
      } else {
          this.spotlight_element.className = class_spotlight_off;
      }
      this.spotlight_element.addEventListener('click', this.spotlight.bind(this), false);
      this.element_root.appendChild(this.spotlight_element);

      // Add mute button/status
      this.mute_element = document.createElement("div");
      this.mute_state = participant_data["is_muted"] == "YES";
      if (this.mute_state) {
          this.mute_element.className = class_mute_on;
      } else {
          this.mute_element.className = class_mute_off;
      }
      this.mute_element.addEventListener('click', this.mute.bind(this), false);
      this.element_root.appendChild(this.mute_element);

      // Add hold/resume button/status
      this.hold_element = document.createElement("div");
      if (participant_data["is_held"] == "YES") {
          this.hold_element.className = class_hold_on;
      } else {
          this.hold_element.className = class_hold_off;
      }
      this.hold_element.addEventListener('click', this.hold.bind(this), false);
      this.element_root.appendChild(this.hold_element);

      // Add see presentation button/status
      this.see_presentation_element = document.createElement("div");
      this.see_presentation_state = participant_data["rx_presentation_policy"] == "ALLOW";
      console.log("see_presentation_state " + this.see_presentation_state);
      if (this.see_presentation_state) {
          this.see_presentation_element.className = class_see_presentation_allowed;
      } else {
          this.see_presentation_element.className = class_see_presentation_denied;
      }
      this.see_presentation_element.addEventListener('click', this.see_presentation.bind(this), false);
      this.element_root.appendChild(this.see_presentation_element);

      // Add overlay text
      this.overlay_text_element = document.createElement("div");
      this.overlay_text_element.className = "particpantOverlayText";

      var currentOverlayText = document.createElement("input");
      currentOverlayText.setAttribute('size', '30');
      currentOverlayText.className = "currentoverlaytext";
      currentOverlayText.setAttribute('disabled', 'true');
      currentOverlayText.id = "currenttext_" + participant_data["uuid"];
      currentOverlayText.value = participant_data["overlay_text"];

      var newOverlayText = document.createElement("input");
      newOverlayText.setAttribute('size', '30');
      newOverlayText.id = "newtext_" + participant_data["uuid"];

      var updateTextButton = document.createElement("input");
      updateTextButton.setAttribute('type', 'button');
      updateTextButton.setAttribute('value', 'update');
      updateTextButton.addEventListener('click', this.overlay.bind(this), false);

      var resetTextButton = document.createElement("input");
      resetTextButton.setAttribute('type', 'button');
      resetTextButton.setAttribute('value', 'reset');
      resetTextButton.addEventListener('click', this.reset_overlay.bind(this), false);

      this.overlay_text_element.appendChild(currentOverlayText);
      this.overlay_text_element.appendChild(newOverlayText);
      this.overlay_text_element.appendChild(updateTextButton);
      this.overlay_text_element.appendChild(resetTextButton);

      // Add transfer button
      if (participant_data["protocol"] != "mssip") {
          this.transfer_element = document.createElement("div");
          this.transfer_element.className = "transferText";

          var transferText = document.createElement("input");
          transferText.setAttribute('size', '30');
          transferText.id = "transfer_" + participant_data["uuid"];
          var transferRole = document.createElement("select");
          transferRole.id = "transferrole_" + participant_data["uuid"];
          var norole = document.createElement("option");
          norole.setAttribute('value', 'norole');
          norole.innerHTML = "";
          transferRole.appendChild(norole);
          var host = document.createElement("option");
          host.setAttribute('value', 'host');
          host.innerHTML = "Host";
          transferRole.appendChild(host);
          var guest = document.createElement("option");
          guest.setAttribute('value', 'guest');
          guest.innerHTML = "Guest";
          transferRole.appendChild(guest);
          var transferPin = document.createElement("input");
          transferPin.setAttribute('size', '5');
          transferPin.id = "transferpin_" + participant_data["uuid"];
          var transferButton = document.createElement("input");
          transferButton.setAttribute('type', 'button');
          transferButton.setAttribute('value', 'transfer');
          transferButton.addEventListener('click', this.transfer.bind(this), false);

          this.transfer_element.appendChild(transferText);
          this.transfer_element.appendChild(transferRole);
          this.transfer_element.appendChild(transferPin);
          this.transfer_element.appendChild(transferButton);
      }

      // Add disconnect button
      var disconnect = document.createElement("div");
      disconnect.className = class_disconnect;
      disconnect.addEventListener('click', this.disconnect.bind(this), false);
      this.element_root.appendChild(disconnect);

      // Add unlock
      this.unlock_element = document.createElement("div");
      this.unlock_element.className = "hide";
      this.unlock_element.addEventListener('click', this.unlock.bind(this), false);
      this.element_root.appendChild(this.unlock_element);

      this.element_root.appendChild(this.uri_element);
      this.element_root.appendChild(this.overlay_text_element);
      if (this.transfer_element != undefined) {
          this.element_root.appendChild(this.transfer_element);
      }

      if (!this.enable_media_buttons) {
          this.spotlight_element.classList.add("disabled_action");
          this.mute_element.classList.add("disabled_action");
          this.hold_element.classList.add("disabled_action");
          this.unlock_element.classList.add("disabled_action");
          this.layout.classList.add("hide");
      }

      // Add into the correct list based on service_type
      this.service_type = participant_data["service_type"];
      if (this.service_type == "conference" || this.service_type == "lecture" || this.service_type == "gateway") {
          console.log("Adding to rosterlist");
          document.getElementById("rosterlist").appendChild(this.element_root);
      } else {
          console.log("Adding to waitingroom");
          if (user.locked == true) {
              // Show participant unlock button
              this.unlock_element.className = user.role + " " + class_lock_on;
          }
          document.getElementById("waitingroom").appendChild(this.element_root);
      }
  }

  Participant.prototype.update = function (participant_data) {
      // console.log("participant update " + this);
      pp = DumpObject(participant_data);
      console.log("participant update: " + JSON.stringify(pp));
      if (participant_data["service_type"] != this.service_type) {
          // Might need to move lists
          if (participant_data["service_type"] == "conference" || participant_data["service_type"] == "lecture" || participant_data["service_type"] == "gateway") {
              try {
                  document.getElementById("waitingroom").removeChild(this.element_root);
              } catch(error) {
                  console.log("Unable to remove participant from waiting room was:" + this.service_type + " now:" + participant_data["service_type"]);
              }
              document.getElementById("rosterlist").appendChild(this.element_root);
              this.unlock_element.className = "hide";
          }
          this.service_type = participant_data["service_type"];
      }

      if (participant_data["protocol"] != undefined) {
          this.protocol_element.innerHTML = "<b>" + participant_data["protocol"] + "</b>";
      }

      this.enable_media_buttons = participant_data["has_media"] && (user.role == 'HOST');
      console.log("enable_media_buttons " + this.enable_media_buttons);

      this.overlay_text = participant_data["overlay_text"];
      document.getElementById("currenttext_" + this.uuid).value = this.overlay_text;

      // Update mute status
      this.mute_state = participant_data["is_muted"] == "YES";
      if (this.mute_state) {
          this.mute_element.className = class_mute_on;
      } else {
          this.mute_element.className = class_mute_off;
      }

      // Update role
      if (participant_data["role"] === "chair") {
          this.chair_role_element.className = class_role_chair_selected;
      } else {
          this.chair_role_element.className = class_role_chair;
      }
      if (participant_data["role"] === "guest") {
          this.guest_role_element.className = class_role_guest_selected;
      } else {
          this.guest_role_element.className = class_role_guest;
      }

      // Update spotlight status
      this.spotlight_state = participant_data["spotlight"] != 0;
      if (this.spotlight_state) {
          this.spotlight_element.className = class_spotlight_on;
      } else {
          this.spotlight_element.className = class_spotlight_off;
      }

      // Update see presentation status
      this.see_presentation_state = participant_data["rx_presentation_policy"] == "ALLOW";
      if (this.see_presentation_state) {
          this.see_presentation_element.className = class_see_presentation_allowed;
      } else {
          this.see_presentation_element.className = class_see_presentation_denied;
      }

      if (!this.enable_media_buttons) {
          this.spotlight_element.classList.add("disabled_action");
          this.mute_element.classList.add("disabled_action");
          this.hold_element.classList.add("disabled_action");
          this.layout.classList.add("hide");
      } else {
          this.spotlight_element.classList.remove("disabled_action");
          this.mute_element.classList.remove("disabled_action");
          this.hold_element.classList.remove("disabled_action");
          this.layout.classList.remove("hide");
      }

  };

  Participant.prototype.remove = function () {
      console.log("participant remove " + this);
      if (this.service_type == "conference" || this.service_type == "lecture" || this.service_type == "gateway") {
          console.log("Remove from roster");
          try {
              document.getElementById("rosterlist").removeChild(this.element_root);
          } catch(error) {
              console.log("Unable to remove from rosterlist");
          }
      } else {
          console.log("Remove from waitingroom");
          try {
              document.getElementById("waitingroom").removeChild(this.element_root);
          } catch(error) {
              console.log("Unable to remove from waitingroom");
          }
      }
  };

  Participant.prototype.disconnect = function () {
      console.log("participant disconnect " + this);
      if (user.role == "HOST") {
          user.post_request("participants/" + this.uuid + "/disconnect", null);
      }
  };

  Participant.prototype.mute = function () {
      console.log("participant mute " + this);
      if (this.enable_media_buttons) {
          if (this.mute_state) {
              user.post_request("participants/" + this.uuid + "/unmute", null);
              this.mute_state = false;
              this.mute_element.className = class_mute_off;
          } else {
              user.post_request("participants/" + this.uuid + "/mute", null);
              this.mute_state = true;
              this.mute_element.className = class_mute_on;
          }
      }
  };

  Participant.prototype.spotlight = function () {
      console.log("participant spotlight " + this);
      if (this.enable_media_buttons) {
          if (this.spotlight_state) {
              user.post_request("participants/" + this.uuid + "/spotlightoff", null);
              this.spotlight_element.className = class_spotlight_off;
          } else {
              user.post_request("participants/" + this.uuid + "/spotlighton", null);
              this.spotlight_element.className = class_spotlight_on;
          }
      }
  };

  Participant.prototype.chair_role = function () {
      console.log("participant chair role " + this);
      if (user.role == "HOST") {
          user.post_request("participants/" + this.uuid + "/role", {"role": "chair"});
          this.chair_role_element.className = class_role_chair_selected;
          this.guest_role_element.className = class_role_guest;
      }
  };

  Participant.prototype.guest_role = function () {
      console.log("participant chair role " + this);
      if (user.role == "HOST") {
          user.post_request("participants/" + this.uuid + "/role", {"role": "guest"});
          this.chair_role_element.className = class_role_chair;
          this.guest_role_element.className = class_role_guest_selected;
      }
  };

  Participant.prototype.hold = function () {
      console.log("participant hold " + this);
      if (this.enable_media_buttons) {
          if (this.hold_element.className == user.role + " " + class_hold_on) {
              user.post_request("participants/" + this.uuid + "/resume", null);
              this.hold_element.className = user.role + " " + class_hold_off;
          } else {
              user.post_request("participants/" + this.uuid + "/hold", null);
              this.hold_element.className = user.role + " " + class_hold_on;
          }
      }
  };

  Participant.prototype.start_speaking = function () {
      console.log("participant start_speaking " + this);
      if (!this.speaking) {
          this.speaking = true;
          this.uri_element.className = "participant_uri_speaking";
      }
  };

  Participant.prototype.stop_speaking = function () {
      console.log("participant stop_speaking " + this);
      if (this.speaking) {
          this.speaking = false;
          this.uri_element.className = "participant_uri";
      }
  };

  Participant.prototype.unlock = function () {
      console.log("participant unlock " + this);
      user.post_request("participants/" + this.uuid + "/unlock", null);
      this.unlock_element.className = "hide";
  };

  Participant.prototype.conference_lock = function (locked) {
      console.log("participant conference_lock " + this);
      if (this.service_type != "conference" && this.service_type != "lecture") {
          if (locked == true) {
              // Show participant unlock button
              this.unlock_element.className = class_lock_on;
          } else {
              this.unlock_element.className = "hide";
          }
      }
  };

  Participant.prototype.overlay = function () {
      console.log("participant overlay " + this);
      var overlay = document.getElementById("newtext_" + this.uuid).value;
      var text_data = {"text": overlay};
      var response = user.post_request("participants/" + this.uuid + "/overlaytext", text_data);
      if (response["status"] == 200) {
          document.getElementById("currenttext_" + this.uuid).value = overlay;
          document.getElementById("newtext_" + this.uuid).value = "";
      } else {
          document.getElementById("newtext_" + this.uuid).value = "FAILED";
      }
  };

  Participant.prototype.reset_overlay = function () {
      console.log("participant reset_overlay " + this);
      var response = user.post_request("participants/" + this.uuid + "/overlaytext");
      if (response["status"] == 200) {
          document.getElementById("currenttext_" + this.uuid).value = "";
          document.getElementById("newtext_" + this.uuid).value = "";
      } else {
          document.getElementById("newtext_" + this.uuid).value = "FAILED";
      }
  };

  Participant.prototype.transfer = function () {
      console.log("participant transfer" + this);
      var target = document.getElementById("transfer_" + this.uuid).value;
      var role = document.getElementById("transferrole_" + this.uuid).value;
      var pin = document.getElementById("transferpin_" + this.uuid).value;
      var text_data = {"conference_alias": target};
      if (role != "norole") {
          text_data["role"] = role;
          text_data["pin"] = pin;
      }
      var response = user.post_request("participants/" + this.uuid + "/transfer", text_data);
  };

  Participant.prototype.see_presentation = function () {
      console.log("participant see presentation " + this);
      if (user.role == 'HOST') {
          if (this.see_presentation_state) {
              user.post_request("participants/" + this.uuid + "/denyrxpresentation", null);
              this.see_presentation_state = false;
              this.see_presentation_element.className = class_see_presentation_denied;
          } else {
              user.post_request("participants/" + this.uuid + "/allowrxpresentation", null);
              this.see_presentation_state = true;
              this.see_presentation_element.className = class_see_presentation_allowed;
          }
      }
  };

  Participant.prototype.avatar_error = function () {
      var fallback = "data:image/png;base64,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";
      this.avatar.src = fallback;
      this.avatar.height = 40;
  };

  Participant.prototype.selected_for_layout = function() {
      return this.layout.checked;
  };

  Participant.prototype.avatar_click = function () {
      if (user.role == "HOST") {
          var layout = user.get_request("participants/" + this.uuid + "/layout");
          console.log("Participant (" + this.uuid + ") layout = " + layout);
      }
  };

  var user = {
      token : null,
      participant_uuid: null,
      node: null,
      conference: null,
      pin: null,
      event_source: null,
      conference_participants: {},
      token_refresh: null,
      role: null,
      locked: false,
      live_active: false,
      guests_muted: false,
      live_active_call: null,
      last_message_origin: null,

      join : function() {
          this.join_with_token(null);
          return false;
      },

      join_with_token : function(token) {
          // Parse conference input into node and conference name
          this.conference = document.getElementById("conference").value;
          this.node = document.getElementById("worker").value;;
          this.pin = document.getElementById("pin").value;
          if (token) {
              this.token = token;
          }
          if (this.request_token()) {
              if (this.start_events()) {
                  // Joined
                  // Toggle join/leave button and show roster lists and conference actions
                  var joinleave = document.getElementById("joinleave");
                  joinleave.value = "Leave Conference";
                  joinleave.className = "red";
                  var joinleaveform = document.getElementById("joinleaveform");
                  joinleaveform.onsubmit = user.leave.bind(this);
                  var conference_status = this.get_request("conference_status");
                  if (conference_status["status"] == 200) {
                      if (conference_status["data"]["result"]["locked"]) {
                          this.locked = true;
                          document.getElementById("conflock").className = class_conference_lock_on;
                      } else {
                          this.locked = false;
                          document.getElementById("conflock").className = class_conference_lock_off;
                      }
                      if (conference_status["data"]["result"]["guests_muted"]) {
                          this.guests_muted = true;
                          document.getElementById("guestsmuted").className = class_conference_guests_mute_on;
                      } else {
                          this.guests_muted = false;
                          document.getElementById("guestsmuted").className = class_conference_guests_mute_off;
                      }
                  }
                  document.getElementById("disconnectall").className = class_conference_disconnect_all;

                  if (this.role == 'GUEST') {
                      document.getElementById("conflock").classList.add("disabled_action");
                      document.getElementById("guestsmuted").classList.add("disabled_action");
                      document.getElementById("disconnectall").classList.add("disabled_action");
                  } else {
                      document.getElementById("conflock").classList.remove("disabled_action");
                      document.getElementById("guestsmuted").classList.remove("disabled_action");
                      document.getElementById("disconnectall").classList.remove("disabled_action");
                  }

                  document.getElementById("confcontrol").className = "";
                  if (typeof jwplayer !== 'undefined') {
                      document.getElementById("liveviewdiv").className = "";
                  }
                  var canvas = document.getElementById("layout_canvas");
                  var ctx = canvas.getContext("2d");
                  ctx.clearRect(0, 0, 280, 200);

                  console.log("Joined " + this);
              } else {
                  this.release_token();
              }
          }
      },

      leave : function() {
          if (this.live_active) {
              try {
                  jwplayer("liveviewplayer").remove();
                  jwplayer("liveviewpresplayer").remove();
              }
              catch(err) {
                  console.log("Failed to remove jwplayer");
              }
              this.live_active = false;
          }

          if (this.event_source) {
              this.event_source.close();
              this.event_source = null;
          }
          console.log("leave " + this);

          if (this.token_refresh) {
              clearInterval(this.token_refresh);
              this.token_refresh = null;
          }

          for (var participant in this.conference_participants) {
              if (this.conference_participants.hasOwnProperty(participant)) {
                  this.conference_participants[participant].remove();
              }
          }

          this.conference_participants = {};

          this.reset_players();

          this.release_token();

          document.getElementById("presentation").className= "hide";
          document.getElementById("liveviewdiv").className = "hide";
          document.getElementById("rtmpaddress").value = "";
          document.getElementById("confcontrol").className = "hide";

          var chatbox_element = document.getElementById("chatbox");
          chatbox_element.innerHTML = "";

          var joinleave = document.getElementById("joinleave");
          joinleave.value = "Join Conference";
          joinleave.className = "green";
          var joinleaveform = document.getElementById("joinleaveform");
          joinleaveform.onsubmit = user.join.bind(this);
          return false;
      },

      request_token : function() {
          var display_name = document.getElementById("display_name").value;
          var two_stage_dial_ext = document.getElementById("two_stage_dial_ext").value;
          var data = { "display_name" : display_name };
          if (two_stage_dial_ext) {
              data["conference_extension"] = two_stage_dial_ext;
          }
          var join_error = document.getElementById("joinerror");
          join_error.innerHTML = "";
          var response = this.post_request("request_token", data);
          console.log("response " + response["status"]);
          if (response["status"] == 200) {
              this.token = response["data"]["result"]["token"];
              this.participant_uuid = response["data"]["result"]["participant_uuid"];
              this.role = response["data"]["result"]["role"];
              if (this.role == undefined) {
                  this.role = "HOST";
              }
              var expires = response["data"]["result"]["expires"];
              if (expires === undefined) {
                  expires = 120;
              }
              this.token_refresh = setInterval(this.refresh_token.bind(this), (expires * 1000) / 2);
              var chat_enabled = response["data"]["result"]["chat_enabled"];
              if (chat_enabled == true) {
                  document.getElementById("chatdiv").className = "";
              } else {
                  document.getElementById("chatdiv").className = "hide";
              }
              return true;
          } else if (response["status"] == 403) {
              html_text = "Failed to join conference: " + response["status"] + "(" + JSON.stringify(response["data"]) + ")";
              if (response["data"]["result"]["pin"] == "required") {
                  html_text = "Failed to join conference: Pin required";
                  if (response["data"]["result"]["guest_pin"] == "none") {
                      html_text += " (none for Guest)";
                  }
              } else if (response["data"]["result"]["conference_extension"] == "required") {
                  if (response["data"]["result"]["conference_extension_type"] == "mssip") {
                      html_text = "Failed to join conference: Lync conference extension required";
                  } else {
                      html_text = "Failed to join conference: Extension required";
                  }
              }
              join_error.innerHTML = html_text;
          } else if (response["status"] == 0) {
              join_error.innerHTML = "Failed to join conference: " + JSON.stringify(response["data"]);
          } else {
              join_error.innerHTML = "Failed to join conference: " + response["status"] + "(" + JSON.stringify(response["data"]) + ")";
          }
          return false;
      },

      refresh_token: function() {
          console.log("refresh_token this " + this);
          var response = this.post_request("refresh_token", null);
          console.log("response " + response["status"]);
          if (response["status"] == 200) {
              this.token = response["data"]["result"]["token"];
              role = response["data"]["result"]["role"] || this.role;
              if (this.role != role) {
                  this.role = role;
                  if (this.role == 'GUEST') {
                      document.getElementById("conflock").classList.add("disabled_action");
                      document.getElementById("guestsmuted").classList.add("disabled_action");
                      document.getElementById("disconnectall").classList.add("disabled_action");
                  } else {
                      document.getElementById("conflock").classList.remove("disabled_action");
                      document.getElementById("guestsmuted").classList.remove("disabled_action");
                      document.getElementById("disconnectall").classList.remove("disabled_action");
                  }
              }
          } else {
              console.log("Refresh failed, leave conference");
              this.leave();
              alert("Token refresh failed");
          }
          return false;
      },

      release_token : function() {
          if (this.token) {
              this.post_request("release_token", null);
              this.token = null;
          }
      },

      liveview : function() {
          if (this.token) {
              console.log("live_active " + this.live_active);
              if (this.live_active == false) {
                  dual_live = document.getElementById("dual_live_sel").checked;
                  var call_data = {"call_type": "rtmp", "streaming": "true"};
                  if (!dual_live) {
                      call_data['present'] = "main";
                  }
                  var response = user.post_request("participants/" + this.participant_uuid + "/calls", call_data);
                  if (response["status"] == 200) {
                      var url = response["data"]["result"]["url"] + "-stream";
                      this.live_active_call = response["data"]["result"]["call_uuid"];
                      console.log("url: " + url);
                      if (dual_live) {
                          var pres_url = response["data"]["result"]["url"] + "-presentation";
                          console.log("pres_url: " + pres_url);
                          jwplayer("liveviewpresplayer").setup({file: pres_url,
                                                                height: 240,
                                                                width: 400,
                                                                aspectratio: "16:9",
                                                                controls: false,
                                                                stretching: "exactfit",
                                                                stagevideo: true,
                                                                rtmp: {bufferlength: 0.1}});
                          jwplayer("liveviewpresplayer").play(true);
                      }
                      jwplayer("liveviewplayer").setup({file: url,
                                                        height: 240,
                                                        width: 400,
                                                        aspectratio: "16:9",
                                                        controls: false,
                                                        stretching: "exactfit",
                                                        stagevideo: true,
                                                        rtmp: {bufferlength: 0.1}});
                      jwplayer("liveviewplayer").play(true);
                      this.live_active = true;
                      document.getElementById("dual_live").className = "hide";
                      document.getElementById("liveview").value = "Stop live view";
                  }
              } else {
                  this.reset_players();
              }
          }
      },

      reset_players : function() {
          this.live_active = false;

          var player_wrapper = document.getElementById("liveviewplayer_wrapper");
          if (player_wrapper != null) {
              player_wrapper.innerHTML = "";
              player_wrapper.removeAttribute("style");
              player_wrapper.id = "liveviewplayer";
          }
          var presplayer_wrapper = document.getElementById("liveviewpresplayer_wrapper");
          if (presplayer_wrapper != null) {
              presplayer_wrapper.innerHTML = "";
              presplayer_wrapper.removeAttribute("style");
              presplayer_wrapper.id = "liveviewpresplayer";
          }

          document.getElementById("liveview").value = "Start live view";
          document.getElementById("dual_live").className = "";

          if (this.live_active_call != null) {
              var response = user.post_request("participants/" + this.participant_uuid + "/calls/" + this.live_active_call + "/disconnect", null);
              this.live_active_call = null;
          }

      },

      getrtmpaddress : function() {
          if (this.token) {
              document.getElementById("rtmpaddress").value="";
              var call_data = {"call_type": "rtmp", "streaming": "true"};
              var response = user.post_request("participants/" + this.participant_uuid + "/calls", call_data);
              if (response["status"] == 200) {
                  var url = response["data"]["result"]["url"] + "-stream";
                  console.log("url: " + url);
                  document.getElementById("rtmpaddress").value=url;
              }
          }
      },

      lock : function() {
          if (this.role == "HOST") {
              if (this.locked == true) {
                  this.post_request("unlock", null);
                  this.locked = false;
                  document.getElementById("conflock").className = class_conference_lock_off;
              } else {
                  this.post_request("lock", null);
                  this.locked = true;
                  document.getElementById("conflock").className = class_conference_lock_on;
              }
          }
      },

      muteallguests : function() {
          if (this.role == "HOST") {
              if (this.guests_muted == true) {
                  this.post_request("unmuteguests", null);
                  this.guests_muted = false;
                  document.getElementById("guestsmuted").className = class_conference_guests_mute_off;
              } else {
                  this.post_request("muteguests", null);
                  this.guests_muted = true;
                  document.getElementById("guestsmuted").className = class_conference_guests_mute_on;
              }
          }
      },

      send_message : function() {
          var chatinput_element = document.getElementById("chatinput");
          var call_data = {"type": "text/plain",
                          "payload": chatinput_element.value};
          this.post_request("message", call_data);
          this.display_message("Me", chatinput_element.value);
          chatinput_element.value = "";
          return false;
      },

      receive_message : function(event) {
          message_data = JSON.parse(event.data);
          console.log("message " + message_data["origin"] + " " + message_data["payload"]);
          this.display_message(message_data["origin"], message_data["payload"]);
      },

      display_message : function(origin, message) {
          var chatbox_element = document.getElementById("chatbox");
          if (this.last_message_origin != origin) {
              this.last_message_origin = origin;
              var origin_element = document.createElement("span");
              origin_element.className ="message_origin";
              origin_element.innerHTML = origin + "<br/>";
              chatbox_element.appendChild(origin_element);
          }
          var message_element = document.createElement("span");
          message_element.className = "message";
          message_element.innerHTML = message + "<br/>";
          chatbox_element.appendChild(message_element);
          chatbox_element.scrollTop = chatbox_element.scrollHeight;
      },

      disconnect_all : function() {
          if (this.role == "HOST") {
              this.post_request("disconnect", null);
          }
      },

      start_events : function() {
          this.event_source = new EventSource("https://" + this.node + "/api/client/v2/conferences/" + this.conference + "/events?token=" + this.token);
          this.event_source.addEventListener("disconnect", user.disconnect.bind(this), false);
          this.event_source.addEventListener("conference_update", user.conference_update.bind(this), false);
          this.event_source.addEventListener("participant_create", user.participant_create.bind(this), false);
          this.event_source.addEventListener("participant_delete", user.participant_delete.bind(this), false);
          this.event_source.addEventListener("participant_update", user.participant_update.bind(this), false);
          this.event_source.addEventListener("presentation_start", user.presentation_start.bind(this), false);
          this.event_source.addEventListener("presentation_stop", user.presentation_stop.bind(this), false);
          this.event_source.addEventListener("presentation_frame", user.presentation_frame.bind(this), false);
          this.event_source.addEventListener("stage", user.stage.bind(this), false);
          this.event_source.addEventListener("refer", user.refer.bind(this), false);
          this.event_source.addEventListener("message_received", user.receive_message.bind(this), false);
          this.event_source.addEventListener("refresh_token", user.refresh_token.bind(this), false);
          this.event_source.addEventListener("layout", user.layout.bind(this), false);
          return true;
      },

      disconnect : function(event) {
          disconnect_data = JSON.parse(event.data);
          console.log("disconnect");
          this.leave();
          alert("You have been disconnected: " + disconnect_data["reason"]);
      },

      refer : function(event) {
          refer_data = JSON.parse(event.data);
          console.log("refer");
          this.leave();
          document.getElementById("conference").value = refer_data["alias"];
          this.join_with_token(refer_data["token"]);
      },

      conference_update : function(event) {
          conference_data = JSON.parse(event.data);
          console.log("conference_update");
          if (conference_data["locked"]) {
              this.locked = true;
              document.getElementById("conflock").className = class_conference_lock_on;
          } else {
              this.locked = false;
              document.getElementById("conflock").className = class_conference_lock_off;
          }
          if (conference_data["guests_muted"]) {
              this.guests_muted = true;
              document.getElementById("guestsmuted").className = class_conference_guests_mute_on;
          } else {
              this.guests_muted = false;
              document.getElementById("guestsmuted").className = class_conference_guests_mute_off;
          }
          if (this.role == 'GUEST') {
              document.getElementById("conflock").classList.add("disabled_action");
              document.getElementById("guestsmuted").classList.add("disabled_action");
          }
          // Go through all participants in the waitingroom and show/hide unlock icon
          for (var participant in this.conference_participants) {
              if (this.conference_participants.hasOwnProperty(participant)) {
                  this.conference_participants[participant].conference_lock(this.locked);
              }
          }
      },

      participant_create : function(event) {
          participant_data = JSON.parse(event.data);
          console.log("participant_create " + participant_data["service_type"]);
          var new_participant = new Participant(participant_data);
          this.conference_participants[participant_data["uuid"]] = new_participant;
      },

      participant_delete : function(event) {
          participant_data = JSON.parse(event.data);
          console.log("participant_delete");
          this.conference_participants[participant_data["uuid"]].remove();
          delete this.conference_participants[participant_data["uuid"]];
      },

      participant_update : function(event) {
          participant_data = JSON.parse(event.data);
          console.log("participant_update " + participant_data["service_type"]);
          this.conference_participants[participant_data["uuid"]].update(participant_data);
      },

      presentation_start : function(event) {
          console.log("presentation_start");
          document.getElementById("presentation").className = "presentation_on";
      },

      presentation_stop : function(event) {
          console.log("presentation_stop");
          document.getElementById("presentation").className = "hide";
      },

      presentation_frame : function(event) {
          console.log("presentation_frame");
          var presentation = document.getElementById("presentation");
          presentation.src = "https://" + this.node + "/api/client/v2/conferences/" + this.conference + "/presentation.jpeg?id=" + event.lastEventId + "&token=" + this.token;
      },

      stage : function(event) {
          console.log("stage");
          stage_data = JSON.parse(event.data);
          var is_speaking = [];
          for (var i = 0; i < stage_data.length; i++) {
              if (stage_data[i]['vad'] > 0) {
                  is_speaking[is_speaking.length] = stage_data[i]['participant_uuid'];
              }
          }
          for (var participant in this.conference_participants) {
              if (this.conference_participants.hasOwnProperty(participant)) {
                  if (is_speaking.indexOf(participant) > -1) {
                      this.conference_participants[participant].start_speaking();
                  } else {
                      this.conference_participants[participant].stop_speaking();
                  }
              }
          }
      },

      layout : function(event) {
          console.log("layout event");
          layout_data = JSON.parse(event.data);
          var canvas = document.getElementById("layout_canvas");
          var ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, 280, 200);
          var positions = {
                            '1:0' : [
                                     { 'x': 40, 'y': 0, 'w': 200, 'h': 200 },
                                    ],
                            '4:0' : [
                                     { 'x': 40, 'y': 0, 'w': 100, 'h': 100 },
                                     { 'x': 140, 'y': 0, 'w': 100, 'h': 100 },
                                     { 'x': 40, 'y': 100, 'w': 100, 'h': 100 },
                                     { 'x': 140, 'y': 100, 'w': 100, 'h': 100 },
                                    ],
                            '1:7' : [
                                     { 'x': 80, 'y': 0, 'w': 120, 'h': 120 },
                                     { 'x': 0, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 40, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 80, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 120, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 160, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 200, 'y': 160, 'w': 40, 'h': 40 },
                                     { 'x': 240, 'y': 160, 'w': 40, 'h': 40 },
                                    ],
                            '1:21' : [
                                      { 'x': 100, 'y': 0, 'w': 80, 'h': 80 },
                                      { 'x': 0, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 40, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 80, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 120, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 160, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 200, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 240, 'y': 80, 'w': 40, 'h': 40 },
                                      { 'x': 0, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 40, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 80, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 120, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 160, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 200, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 240, 'y': 120, 'w': 40, 'h': 40 },
                                      { 'x': 0, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 40, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 80, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 120, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 160, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 200, 'y': 160, 'w': 40, 'h': 40 },
                                      { 'x': 240, 'y': 160, 'w': 40, 'h': 40 },
                                     ]
                          };
          var current = 0;
          for (var i = 0; i < layout_data['participants'].length; i++) {
              var participant_uuid = layout_data['participants'][i];
              var avatar = this.conference_participants[participant_uuid].avatar;
              position = positions[layout_data['view']][current++];
              ctx.drawImage(avatar, position['x'], position['y'], position['w'], position['h']);
          }
      },

      overridelayout : function(event) {
          var layouts = [];
          var participant_ids = [];
          for (var participant in this.conference_participants) {
              if (this.conference_participants.hasOwnProperty(participant)) {
                  if (this.conference_participants[participant].selected_for_layout()) {
                      participant_ids[participant_ids.length] = this.conference_participants[participant].uuid;
                  }
              }
          }
          console.log("participants: " + participant_ids);
          var actors_element = document.getElementById("actors");
          var layout_element = document.getElementById("layout");
          var plusn_element = document.getElementById("plusn");
          var vadbackfill_element = document.getElementById("vadbackfill");
          var overlaytext_element = document.getElementById("overlay_text");
          var indicators_element = document.getElementById("indicators");
          var audience_element = document.getElementById("audience");
          var actors_value = participant_ids;
          if (actors_element.value == "everyone") {
              actors_value = [];
          }

          var audience_value = [];
          if (audience_element.value == "hosts") {
              audience_value = "hosts";
          }

          layouts.push({"actors": actors_value,
                        "layout": layout_element.value,
                        "plus_n": plusn_element.value,
                        "vad_backfill": vadbackfill_element.checked,
                        "actors_overlay_text": overlaytext_element.value,
                        "indicators": indicators_element.value,
                        "audience": audience_value });

          if (audience_value == "hosts") {
              // Get the "guests" view
              var guest_actors_element = document.getElementById("guest_actors");
              var guest_layout_element = document.getElementById("guest_layout");
              var guest_plusn_element = document.getElementById("guest_plusn");
              var guest_vadbackfill_element = document.getElementById("guest_vadbackfill");
              var guest_overlaytext_element = document.getElementById("guest_overlay_text");
              var guest_indicators_element = document.getElementById("guest_indicators");
              var guest_audience_element = document.getElementById("guest_audience");
              var guest_actors_value = participant_ids;
              if (guest_actors_element.value == "everyone") {
                  guest_actors_value = [];
              }
              layouts.push({"actors": guest_actors_value,
                            "layout": guest_layout_element.value,
                            "plus_n": guest_plusn_element.value,
                            "vad_backfill": guest_vadbackfill_element.checked,
                            "actors_overlay_text": guest_overlaytext_element.value,
                            "indicators": guest_indicators_element.value,
                            "audience": [] });
          }

          var call_data = {"layouts": layouts };
          var response = user.post_request("override_layout", call_data);
          if (response["status"] == 200) {
              console.log("Set new layout!");
          }
      },

      dial : function(event) {
          var protocol = document.getElementById("protocol");
          var localalias = document.getElementById("localalias");
          var localdisplayname = document.getElementById("localdisplayname");
          var remotealias = document.getElementById("remotealias");
          var role = document.getElementById("role");

          this.action_dial(protocol.value, localalias.value, localdisplayname.value, remotealias.value, role.value);
      },

      action_dial : function(protocol, source, source_display_name, destination, role) {
          var call_data = {"protocol": protocol,
                           "source" : source,
                           "destination" : destination,
                           "role" : role };
          if (protocol == "rtmp") {
              call_data["streaming"] = "yes";
          }
          if (source_display_name) {
              call_data["source_display_name"] = source_display_name;
          }
          var response = user.post_request("dial", call_data);
          if (response["status"] == 200) {
              console.log("Dial out success");
          }
      },

      resetlayout : function(event) {
          var call_data = {"layouts": [] };
          var response = user.post_request("override_layout", call_data);
          if (response["status"] == 200) {
              console.log("Reset layout!");
          }
      },

      post_request : function(command, data) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("POST", "https://" + this.node + "/api/client/v2/conferences/" + this.conference + "/" + command, false);
          if (this.token) {
              xmlhttp.setRequestHeader("token", this.token);
          }
          if (this.pin) {
              xmlhttp.setRequestHeader("pin", this.pin);
          }
          try {
              if (data) {
                  xmlhttp.setRequestHeader("Content-Type", "application/json");
                  xmlhttp.send(JSON.stringify(data));
              } else {
                  xmlhttp.send();
              }
              console.log("responseText " + xmlhttp.responseText);
              return {"status" : xmlhttp.status, "data" : JSON.parse(xmlhttp.responseText)};
          } catch(exception) {
              console.log("Exception during post_request");
              return {"status" : xmlhttp.status, "data" : {"reason": exception.toString()}};
          }
      },

      get_request : function(command) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("GET", "https://" + this.node + "/api/client/v2/conferences/" + this.conference + "/" + command, false);
          if (this.token) {
              xmlhttp.setRequestHeader("token", this.token);
          }
          if (this.pin) {
              xmlhttp.setRequestHeader("pin", this.pin);
          }
          try {
              xmlhttp.send();
              console.log("responseText " + xmlhttp.responseText);
              return {"status" : xmlhttp.status, "data" : JSON.parse(xmlhttp.responseText)};
          } catch(exception) {
              console.log("Exception during get_request");
              return {"status" : xmlhttp.status, "data" : {"reason": exception.toString()}};
          }
      },

  };

  var reg = {
      token : null,
      event_source: null,
      token_refresh: null,

      register : function() {
          var alias = document.getElementById("reg_alias").value;
          var host = document.getElementById("reg_host").value;
          this.node = host;
          this.alias = alias;
          if (this.request_token()) {
              if (this.start_events()) {
                  // Registered
                  // Toggle register/unregister button
                  var regunreg = document.getElementById("register");
                  regunreg.value = "Unregister";
                  regunreg.className = "red";
                  regunreg.onclick = reg.unregister.bind(this);
                  console.log("Registered " + this);
              } else {
                  this.release_token();
              }
          }
      },

      unregister : function() {
          if (this.event_source) {
              this.event_source.close();
              this.event_source = null;
          }
          console.log("Unregister " + this);

          if (this.token_refresh) {
              clearInterval(this.token_refresh);
              this.token_refresh = null;
          }

          this.release_token();

          var regunreg = document.getElementById("register");
          regunreg.value = "Register";
          regunreg.className = "green";
          regunreg.onclick = reg.register.bind(this);
      },

      request_token : function() {
          var username = document.getElementById("reg_username").value;
          var password = document.getElementById("reg_password").value;
          var response = this.post_request("request_token", null, username, password);
          var reg_error = document.getElementById("regerror");
          reg_error.innerHTML = "";
          console.log("response " + response["status"]);
          if (response["status"] == 200) {
              this.token = response["data"]["result"]["token"];
              this.registration_uuid = response["data"]["result"]["registration_uuid"];
              var expires = response["data"]["result"]["expires"];
              if (expires === undefined) {
                  expires = 120;
              }
              this.token_refresh = setInterval(this.refresh_token.bind(this), (expires * 1000) / 2);
              return true;
          } else if (response["status"] == 401) {
              reg_error.innerHTML = "Failed to register: Unauthorized";
          } else if (response["status"] == 0) {
              reg_error.innerHTML = "Failed to register: " + JSON.stringify(response["data"]);
          } else {
              reg_error.innerHTML = "Failed to register: " + response["status"] + "(" + JSON.stringify(response["data"]) + ")";
          }
          return false;
      },

      refresh_token: function() {
          console.log("refresh_token this " + this);
          var response = this.post_request("refresh_token", null);
          console.log("response " + response["status"]);
          if (response["status"] == 200) {
              this.token = response["data"]["result"]["token"];
          } else {
              console.log("Refresh failed, unregister");
              this.unregister();
              alert("Token refresh failed");
          }
          return false;
      },

      release_token : function() {
          if (this.token) {
              this.post_request("release_token", null);
              this.token = null;
          }
      },

      start_events : function() {
          this.event_source = new EventSource("https://" + this.node + "/api/client/v2/registrations/" + this.alias + "/events?token=" + this.token);
          this.event_source.addEventListener("incoming", reg.incoming.bind(this), false);
          this.event_source.addEventListener("incoming_cancelled", reg.incoming_cancelled.bind(this), false);
          return true;
      },

      incoming : function(event) {
          incoming_data = JSON.parse(event.data);
          console.log("incoming");
          var confirm_string = "Incoming call from:\n" +
                               incoming_data["remote_display_name"] +
                               " ( " + incoming_data["remote_alias"] +
                               " )\nanswer?";
          if (confirm(confirm_string)) {
              // Answer the call
              document.getElementById("conference").value = incoming_data["conference_alias"];
              document.getElementById("worker").value = this.node;
              document.getElementById("pin").value = "";
              user.join_with_token(incoming_data["token"]);
          } else {
              // Reject the call
              this.release_incoming_token(incoming_data['token'], incoming_data['conference_alias']);
          }
      },

      incoming_cancelled : function(event) {
          incoming_data = JSON.parse(event.data);
          console.log("incoming cancelled");
          // TODO better dialog support, so we can close when call is cancelled
      },

      release_incoming_token : function(token, conference) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("POST", "https://" + this.node + "/api/client/v2/conferences/" + conference + "/release_token", false);
          if (token) {
              xmlhttp.setRequestHeader("token", token);
          }
          try {
              xmlhttp.send();
              console.log("responseText " + xmlhttp.responseText);
              return {"status" : xmlhttp.status, "data" : JSON.parse(xmlhttp.responseText)};
          } catch(exception) {
              console.log("Exception during post_request");
              return {"status" : xmlhttp.status, "data" : {}};
          }
      },

      post_request : function(command, data, username, password) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("POST", "https://" + this.node + "/api/client/v2/registrations/" + this.alias + "/" + command, false);
          if (this.token) {
              xmlhttp.setRequestHeader("token", this.token);
          }
          var enc = window.btoa(username + ":" + password);
          xmlhttp.setRequestHeader("Authorization", "x-pexip-basic " + enc);
          try {
              if (data) {
                  xmlhttp.setRequestHeader("Content-Type", "application/json");
                  xmlhttp.send(JSON.stringify(data));
              } else {
                  xmlhttp.send();
              }
              console.log("responseText " + xmlhttp.responseText);
              return {"status" : xmlhttp.status, "data" : JSON.parse(xmlhttp.responseText)};
          } catch(exception) {
              console.log("Exception during post_request");
              return {"status" : xmlhttp.status, "data" : {}};
          }
      },

      get_request : function(command) {
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("GET", "https://" + this.node + "/api/client/v2/registrations/" + this.alias + "/" + command, false);
          if (this.token) {
              xmlhttp.setRequestHeader("token", this.token);
          }
          try {
              xmlhttp.send();
              console.log("responseText " + xmlhttp.responseText);
              return {"status" : xmlhttp.status, "data" : JSON.parse(xmlhttp.responseText)};
          } catch(exception) {
              console.log("Exception during get_request");
              return {"status" : xmlhttp.status, "data" : {}};
          }
      },

  };
