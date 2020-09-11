// ==UserScript==
// @name         巴哈姆特哈拉區頂端列顯示檢舉數提醒與各板檢舉數
// @namespace    https://home.gamer.com.tw/moontai0724
// @version      4.1
// @description  於巴哈姆特哈拉區頂端列顯示檢舉數提醒與各板檢舉數
// @author       moontai0724
// @match        https://*.gamer.com.tw/*
// @match        http://*.gamer.com.tw/*
// @connect      forum.gamer.com.tw
// @resource     topBarCss https://raw.githubusercontent.com/moontai0724/bahamut-topbar-accuse-script/master/index.css
// @grant        GM_xmlhttpRequest
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(async function (jQuery) {
  'use strict';
  if (BAHAID) {
    GM_addStyle(GM_getResourceText("topBarCss"));

    var list = [{
      id: 'post',
      name: '文章',
      href: 'https://forum.gamer.com.tw/gemadmin/accuse_B_2k14.php?t=2&s=1&n=1',
      t: 2
    }, {
      id: 'comment',
      name: '留言',
      href: 'https://forum.gamer.com.tw/gemadmin/accuse_commend_2k14.php?t=1&s=1&n=1',
      t: 1
    }, {
      id: 'chatRoom',
      name: '聊天室',
      href: 'https://forum.gamer.com.tw/gemadmin/accuse_im_2k14.php?t=3&s=1&n=1',
      t: 3
    }];

    for (let i = 0; i <= 2; i++) {
      if (location.host == "ani.gamer.com.tw") {
        let iconsName = ["description", "list", "chat_bubble_outline"];
        let li = document.createElement("li");

        let span = document.createElement("span");
        span.id = `topBar_accuse_${list[i].id}`;
        span.setAttribute("class", `ani_top_accuse_${list[i].id}`);
        li.appendChild(span);

        let topIcon = document.createElement("a");
        topIcon.href = `javascript:TOPBAR_show('accuse_${list[i].id}')`;
        topIcon.innerHTML = `<i class="material-icons">${iconsName[i]}</i>`
        li.appendChild(topIcon);

        // 新增頂端列 icon
        jQuery(li).insertBefore(`.member li:nth-child(${2 + i})`);
      } else {
        let topIcon = document.createElement("a");
        topIcon.href = `javascript:TopBar.showMenu('accuse_${list[i].id}', 'top_accuse_${list[i].id}')`;
        topIcon.id = `topBar_accuse_${list[i].id}`;
        topIcon.setAttribute("class", `top_accuse_${list[i].id}`);

        // 新增頂端列 icon
        jQuery(topIcon).insertBefore("#topBar_light_0");
      }


      // 新增列表
      let infoWindow = document.createElement("div");
      infoWindow.id = `topBarMsg_accuse_${list[i].id}`;
      infoWindow.setAttribute("class", "TOP-msg");
      infoWindow.setAttribute("style", "display: none;");

      // Title
      let title = document.createElement("span");
      title.innerHTML = `${list[i].name}檢舉`;
      infoWindow.appendChild(title);

      // content
      let content = document.createElement("div");
      content.setAttribute("class", "TOP-msglist");
      content.id = `topBarMsgList_accuse_${list[i].id}`;
      content.innerHTML = await getAccuseList(list[i]);
      infoWindow.appendChild(content);

      // button
      let msgBtn = document.createElement(location.host == "ani.gamer.com.tw" ? "p" : "a");
      msgBtn.setAttribute("class", "TOP-msgbtn");

      let link = document.createElement("a");
      link.href = list[i].href;
      link.setAttribute("target", "_blank");
      link.setAttribute("style", "width: auto;")
      link.innerHTML = `<i class="fa fa-bars" aria-hidden="true"></i>看所有${list[i].name}檢舉`;
      msgBtn.appendChild(link);

      infoWindow.appendChild(msgBtn);

      // 新增小窗
      jQuery(infoWindow).insertBefore("#topBarMsg_light_0");
    }
  }

  // 獲取檢舉數
  function getAccuseList(type) {
    return new Promise(function (resolve, reject) {
      getAccuseCount(type.t).then(data => {
        // 設定檢舉案數量提醒
        setAccuseCount(type.id, data.total);

        let accuseList = [];
        // 當有檢舉案就加入
        for (let board = 0; board < data.data.length; board++) {
          let list = document.createElement("div");

          let link = document.createElement("a");
          link.href = `${type.href}&bsn=${data.data[board].bsn}`;
          link.setAttribute("target", "_blank");
          link.innerHTML = `在 ${data.data[board].title} 哈拉板有 ${data.data[board].count} 則檢舉案。`;
          list.appendChild(link);

          accuseList.push(list.outerHTML);
        }

        resolve(accuseList.length > 0 ? accuseList.join() : "<div>太棒了！這裡沒有任何檢舉案。</div>");
      });
    });
  }

  function setAccuseCount(id, accuseCount) {
    jQuery(`#topBar_accuse_${id}`).html(accuseCount > 0 ? (location.host == "ani.gamer.com.tw" ? accuseCount : `<span>${accuseCount}</span>`) : "");
  }

  // 巴哈姆特 API

  // 獲取有檢舉案之看板編號與名稱及檢舉數
  // t 為檢舉類型，1 為留言，2 為文章，3 為聊天室
  // s 為檢舉處理狀況，1 為待處理案，2 為已結案區
  function getAccuseCount(t) {
    return new Promise(function (resolve, reject) {
      GM_xmlhttpRequest({
        method: "POST",
        url: "https://forum.gamer.com.tw/ajax/BMaccuse_menu_2k14.php",
        cache: false,
        data: `t=${t}&s=1&n=1`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        onload: data => {
          data = JSON.parse(data.response).data;
          let response = {
            total: 0,
            data: []
          };
          for (let key in data) {
            response.data[response.data.length] = {
              bsn: Number(key.replace('F:', '')),
              title: data[key].title,
              count: Number(data[key].num)
            };
            response.total += Number(data[key].num);
          }
          resolve(response);
        },
        onerror: error => {
          console.error(error);
          reject(error);
        }
      });
    });
  }
})(jQuery);
