(() => {

  /* =====================================================
     PointDrop
     防止插件被重复插入当前网页
  ===================================================== */

  if (
    document.getElementById(
      "pointdrop-root"
    )
  ) {
    return;
  }


  /* =====================================================
     创建 PointDrop 根节点
  ===================================================== */

  const root =
    document.createElement("div");

  root.id =
    "pointdrop-root";


  root.innerHTML = `

    <!-- =========================
         顶部 Trigger
    ========================== -->

    <div class="pd-trigger-zone">

      <div class="pd-trigger">

        <span class="pd-trigger-small">
          ▬
        </span>

        <span class="pd-trigger-text">
          + Point
        </span>

      </div>

    </div>



    <!-- =========================
         主面板
    ========================== -->

    <div class="pd-panel">


      <!-- =======================
           Capture
      ======================== -->

      <div class="pd-capture">

        <div class="pd-header">

          <div>

            <div class="pd-brand">
              PointDrop
            </div>

            <div class="pd-draft-status">
              Draft saved automatically
            </div>

          </div>


          <button
            class="pd-close"
            type="button"
            title="Close"
          >
            ×
          </button>

        </div>


        <textarea
          class="pd-input"
          placeholder="What's on your mind?"
        ></textarea>


        <div class="pd-footer">

          <span>
            Shift + Enter 换行
          </span>

          <span>
            Enter · Save
          </span>

        </div>

      </div>



      <!-- =======================
           Saved 状态
      ======================== -->

      <div class="pd-saved">

        <div class="pd-saved-icon">
          ✓
        </div>

        <div>
          Saved
        </div>

      </div>



      <!-- =======================
           Inbox 按钮
      ======================== -->

      <button
        class="pd-inbox-toggle"
        type="button"
      >

        <span>
          Recent Points
        </span>

        <span class="pd-arrow">
          ↓
        </span>

      </button>



      <!-- =======================
           Inbox
      ======================== -->

      <div class="pd-inbox">

        <input
          class="pd-search"
          type="text"
          placeholder="Search your points..."
        >


        <div class="pd-point-list">
        </div>

      </div>


    </div>

  `;


  document.documentElement
    .appendChild(root);



  /* =====================================================
     获取页面元素
  ===================================================== */

  const panel =
    root.querySelector(
      ".pd-panel"
    );


  const trigger =
    root.querySelector(
      ".pd-trigger-zone"
    );


  const input =
    root.querySelector(
      ".pd-input"
    );


  const closeButton =
    root.querySelector(
      ".pd-close"
    );


  const capture =
    root.querySelector(
      ".pd-capture"
    );


  const saved =
    root.querySelector(
      ".pd-saved"
    );


  const draftStatus =
    root.querySelector(
      ".pd-draft-status"
    );


  const inboxToggle =
    root.querySelector(
      ".pd-inbox-toggle"
    );


  const inbox =
    root.querySelector(
      ".pd-inbox"
    );


  const arrow =
    root.querySelector(
      ".pd-arrow"
    );


  const search =
    root.querySelector(
      ".pd-search"
    );


  const pointList =
    root.querySelector(
      ".pd-point-list"
    );



  /* =====================================================
     Draft
     读取未正式保存的内容
  ===================================================== */

  async function loadDraft() {

    try {

      const result =
        await chrome.storage.local.get(
          "draft"
        );


      input.value =
        result.draft || "";



      /*
       根据是否存在 Draft
       更新状态文字
      */

      updateDraftStatus();

    }
    catch (error) {

      console.error(
        "PointDrop: failed to load draft",
        error
      );

    }

  }



  /* =====================================================
     Draft 状态提示
  ===================================================== */

  function updateDraftStatus() {

    const hasDraft =
      input.value.trim().length > 0;


    if (hasDraft) {

      draftStatus.textContent =
        "Draft saved automatically";

      draftStatus.classList.add(
        "pd-draft-active"
      );

    }
    else {

      draftStatus.textContent =
        "Start typing to capture a thought";

      draftStatus.classList.remove(
        "pd-draft-active"
      );

    }

  }



  /* =====================================================
     自动保存 Draft

     用户每输入一个字符，
     都把当前内容同步到
     chrome.storage.local
  ===================================================== */

  input.addEventListener(
    "input",
    async () => {

      try {

        await chrome.storage.local.set({

          draft:
            input.value,

          draftUpdatedAt:
            new Date()
              .toISOString()

        });


        updateDraftStatus();

      }
      catch (error) {

        console.error(
          "PointDrop: failed to save draft",
          error
        );

      }

    }
  );



  /* =====================================================
     打开 PointDrop
  ===================================================== */

  async function openPointDrop() {

    /*
     每一次打开时
     都重新获取最新 Draft

     因此即使刚刚从百度切到 B 站，
     也会读取同一份草稿。
    */

    await loadDraft();


    panel.classList.add(
      "pd-open"
    );


    setTimeout(() => {

      input.focus();


      /*
       光标放到 Draft 最后面，
       方便继续输入。
      */

      const length =
        input.value.length;


      input.setSelectionRange(
        length,
        length
      );

    }, 180);

  }



  /* =====================================================
     关闭 PointDrop
  ===================================================== */

  function closePointDrop() {

    panel.classList.remove(
      "pd-open"
    );


    input.blur();

  }



  /* =====================================================
     点击顶部按钮
  ===================================================== */

  trigger.addEventListener(
    "click",
    openPointDrop
  );



  /* =====================================================
     点击 X
  ===================================================== */

  closeButton.addEventListener(
    "click",
    closePointDrop
  );



  /* =====================================================
     键盘操作

     Enter
     =
     正式保存

     Shift + Enter
     =
     换行

     Escape
     =
     关闭
  ===================================================== */

  input.addEventListener(
    "keydown",
    event => {


      /* =========================
         Enter Save
      ========================== */

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        savePoint();

      }


      /* =========================
         Escape Close
      ========================== */

      if (
        event.key === "Escape"
      ) {

        event.preventDefault();


        closePointDrop();

      }

    }
  );



  /* =====================================================
     保存正式 Point
  ===================================================== */

  async function savePoint() {

    const content =
      input.value.trim();


    /*
     空内容不保存
    */

    if (!content) {

      return;

    }


    try {

      /*
       读取历史 Points
      */

      const result =
        await chrome.storage.local.get(
          "points"
        );


      const points =
        result.points || [];



      /*
       创建新的 Point
      */

      const newPoint = {

        id:
          crypto.randomUUID(),

        content:
          content,

        createdAt:
          new Date()
            .toISOString()

      };



      /*
       最新 Point
       放到最前面
      */

      points.unshift(
        newPoint
      );



      /*
       同时完成两件事情：

       1. 保存 Point
       2. 清空 Draft

       只有真正 Enter Save
       才会清除 Draft
      */

      await chrome.storage.local.set({

        points:
          points,

        draft:
          "",

        draftUpdatedAt:
          null

      });



      /*
       清空当前输入框
      */

      input.value = "";


      updateDraftStatus();



      /* =========================
         Saved 动画
      ========================== */

      capture.style.display =
        "none";


      saved.classList.add(
        "pd-show"
      );



      /*
       更新历史记录
      */

      await renderPoints();



      /*
       650ms 后关闭
      */

      setTimeout(() => {

        saved.classList.remove(
          "pd-show"
        );


        capture.style.display =
          "block";


        closePointDrop();

      }, 650);

    }
    catch (error) {

      console.error(
        "PointDrop: failed to save point",
        error
      );

    }

  }



  /* =====================================================
     Inbox 展开 / 收起
  ===================================================== */

  inboxToggle.addEventListener(
    "click",
    async () => {

      const isOpen =
        inbox.classList.toggle(
          "pd-inbox-open"
        );


      arrow.textContent =
        isOpen
          ? "↑"
          : "↓";


      if (isOpen) {

        await renderPoints();

      }

    }
  );



  /* =====================================================
     搜索
  ===================================================== */

  search.addEventListener(
    "input",
    renderPoints
  );



  /* =====================================================
     删除 Point
  ===================================================== */

  async function deletePoint(id) {

    try {

      const result =
        await chrome.storage.local.get(
          "points"
        );


      const allPoints =
        result.points || [];


      const newPoints =
        allPoints.filter(
          point =>
            point.id !== id
        );


      await chrome.storage.local.set({

        points:
          newPoints

      });


      await renderPoints();

    }
    catch (error) {

      console.error(
        "PointDrop: failed to delete point",
        error
      );

    }

  }



  /* =====================================================
     格式化时间
  ===================================================== */

  function formatTime(
    dateString
  ) {

    const date =
      new Date(dateString);


    return date.toLocaleTimeString(
      "zh-CN",
      {

        hour:
          "2-digit",

        minute:
          "2-digit"

      }
    );

  }



  /* =====================================================
     判断 TODAY / YESTERDAY
  ===================================================== */

  function getDateLabel(
    dateString
  ) {

    const target =
      new Date(dateString);


    const now =
      new Date();



    const today =
      new Date(

        now.getFullYear(),

        now.getMonth(),

        now.getDate()

      );



    const targetDay =
      new Date(

        target.getFullYear(),

        target.getMonth(),

        target.getDate()

      );



    const diff =
      Math.round(

        (
          today -
          targetDay
        )

        /

        86400000

      );



    if (diff === 0) {

      return "TODAY";

    }



    if (diff === 1) {

      return "YESTERDAY";

    }



    return target
      .toLocaleDateString(
        "zh-CN",
        {

          month:
            "short",

          day:
            "numeric"

        }
      );

  }



  /* =====================================================
     展示历史 Points
  ===================================================== */

  async function renderPoints() {

    try {

      const result =
        await chrome.storage.local.get(
          "points"
        );


      const allPoints =
        result.points || [];



      const keyword =
        search.value
          .trim()
          .toLowerCase();



      /* =========================
         搜索过滤
      ========================== */

      const filteredPoints =
        keyword

          ? allPoints.filter(
              point =>

                point.content
                  .toLowerCase()
                  .includes(keyword)

            )

          : allPoints;



      /*
       清空旧内容
      */

      pointList.innerHTML = "";



      /* =========================
         Empty State
      ========================== */

      if (
        filteredPoints.length === 0
      ) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "pd-empty";


        empty.textContent =
          keyword
            ? "No matching points."
            : "Nothing here yet.";


        pointList.appendChild(
          empty
        );


        return;

      }



      /* =========================
         按日期分组
      ========================== */

      const groups = {};


      filteredPoints.forEach(
        point => {

          const label =
            getDateLabel(
              point.createdAt
            );


          if (!groups[label]) {

            groups[label] = [];

          }


          groups[label]
            .push(point);

        }
      );



      /* =========================
         生成每一组
      ========================== */

      Object.entries(groups)
        .forEach(
          ([label, points]) => {


            const section =
              document.createElement(
                "div"
              );



            /* 日期 */

            const labelElement =
              document.createElement(
                "div"
              );


            labelElement.className =
              "pd-section-label";


            labelElement.textContent =
              label;


            section.appendChild(
              labelElement
            );



            /* 每一个 Point */

            points.forEach(
              point => {


                const item =
                  document.createElement(
                    "div"
                  );


                item.className =
                  "pd-point";



                /* Point 内容 */

                const content =
                  document.createElement(
                    "div"
                  );


                content.className =
                  "pd-point-content";


                content.textContent =
                  point.content;



                /* 时间 */

                const meta =
                  document.createElement(
                    "div"
                  );


                meta.className =
                  "pd-point-meta";


                meta.textContent =
                  formatTime(
                    point.createdAt
                  );



                /* 删除按钮 */

                const deleteButton =
                  document.createElement(
                    "button"
                  );


                deleteButton.className =
                  "pd-delete";


                deleteButton.type =
                  "button";


                deleteButton.textContent =
                  "×";


                deleteButton.title =
                  "Delete";



                deleteButton
                  .addEventListener(
                    "click",
                    event => {

                      event.stopPropagation();


                      deletePoint(
                        point.id
                      );

                    }
                  );



                item.appendChild(
                  content
                );


                item.appendChild(
                  meta
                );


                item.appendChild(
                  deleteButton
                );


                section.appendChild(
                  item
                );

              }
            );


            pointList.appendChild(
              section
            );

          }
        );

    }
    catch (error) {

      console.error(
        "PointDrop: failed to render points",
        error
      );

    }

  }



  /* =====================================================
     跨网页 / 跨标签页 Draft 同步
  ===================================================== */

  chrome.storage.onChanged.addListener(

    (
      changes,
      areaName
    ) => {


      /*
       我们只关心 local storage
      */

      if (
        areaName !== "local"
      ) {

        return;

      }



      /* =========================
         Draft 发生变化
      ========================== */

      if (
        changes.draft
      ) {


        /*
         当前这个网页正在真正输入时，
         不要突然覆盖用户当前输入。

         但是隐藏标签页可以正常同步。
        */

        const isTypingHere =

          document.activeElement
            === input

          &&

          !document.hidden;



        if (!isTypingHere) {

          input.value =
            changes.draft.newValue
            || "";


          updateDraftStatus();

        }

      }



      /* =========================
         Points 发生变化

         例如其它 Tab 保存了 Point，
         当前 Tab 的 Inbox 也同步更新。
      ========================== */

      if (
        changes.points
      ) {

        renderPoints();

      }

    }

  );



  /* =====================================================
     初始化
  ===================================================== */

  renderPoints();

  loadDraft();


})();