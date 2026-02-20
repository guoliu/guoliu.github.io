---
title: "Matters 的架構與技術棧"
date: "2020-08-09T06:59:34.145Z"
tags:
  - "開源 Matters"
  - "JAMstack"
  - "Quilljs"
  - "TypeScript"
  - "NodeJS"
  - "開源"
  - "Matters開源計畫"
  - "github"
  - "Progressive Web App"
  - "React "
  - "Nextjs"
  - "GraphQL"
cover: "[[assets/d7de54bf-4272-42ed-ac8e-2d7cd91988ad.png]]"
syndicated:
  - "https://matters.town/@guo/matters-的架構與技術棧-7a27j2b2lwkq"
---



![](../assets/d7de54bf-4272-42ed-ac8e-2d7cd91988ad.png)*photo credit: Ray Wenderlich*

隨著開源計劃的啓動，馬特市市民們可以直接看到馬特市的所有機制和邏輯。全面開放代碼倉庫後，任何人都可以提出建議和想法、提交功能和優化，也可以自行建立像馬特市一樣的平臺，參與到馬特市生態的演進中。

過去兩年的持續迭代後，馬特市有了越來越多的功能，也有了越來越大的容量。這使得整個系統變得越來越複雜，即使是職業的軟件開發者，也需要花上不少精力才能使用和參與。

之前，我們曾介紹過[馬特市 API 的文檔與測試環境](https://matters.news/@robertu/%E7%A4%BE%E5%8D%80%E9%96%8B%E6%94%BE%E4%B8%80%E5%B0%8F%E6%AD%A5-matters-api-zdpuAyovU8xL9sYsV5rQfe35XhmN6okTVbnogCFH2J8cqAXCs)，現在也有了一個專門的倉庫用於[技術文檔](https://github.com/thematters/developer-resource)、[協作文檔](https://github.com/thematters/developer-resource/wiki)與 [issue 提交](https://github.com/thematters/developer-resource/issues)。之後，我們將會繼續撰寫一系列文章，介紹馬特市整個系統的不同側面。

本文是這個系列的第一篇，介紹整個系統大致的結構與思路。一部分涉及的代碼倉庫尚未公開，如果你想搶先嘗試，可以報名[馬特市開源計劃招募](https://matters.news/@hi176/matters%E9%96%8B%E6%BA%90%E8%A8%88%E7%95%AB%E5%95%9F%E5%8B%95-%E9%82%80%E8%AB%8B%E4%BD%A0%E4%BE%86%E5%85%B1%E5%BB%BA%E9%A6%AC%E7%89%B9%E5%B8%82-bafyreiadaxjjwxk6mhsx4u6ognhxw3atlwiloscyn7r2iff6tsz4rrc4by)。

# [前端](https://github.com/thematters/matters-web)

馬特市的網頁前端是一個 [Progressive Web App](https://en.wikipedia.org/wiki/Progressive_web_application)，採用響應式設計適配不同的設備，並讓用戶在添加到桌面之後能夠獲得類似原生應用的體驗。前端與後端通過 [GraphQL](https://graphql.org/) 來調用數據、定義數據結構，並均以 [TypeScript](https://www.typescriptlang.org/) 寫成。

相比後端，前端更容易上手，也可能是社區設計者和開發者最能夠發揮想像力的地方。[本地開發](https://github.com/thematters/matters-web#start-local-dev)時，我們可以將前端指向馬特市的生產環境、及時看到改動在真實數據上的效果，也可以通過 [Apollo Playground](https://server-test.matters.news/playground) 查看API文檔、直接測試 query 語句。

借鑑 [JAMstack 架構](https://jamstack.wtf/)，馬特市網頁的渲染大致分爲兩步：當用戶訪問馬特市的一個網頁時，會先從服務器的緩存中調取網頁的公開版本；在送達用戶的瀏覽器後，網頁會根據用戶的登錄狀態向後端請求個人數據，並更新網頁中個性化的部分。

網頁的服務端渲染由 [Next.js](https://nextjs.org/) 實現，文檔結構也受到 Next.js 影響。每個網頁的入口位於 `src/pages` 中，通過 [Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes) 將文檔路徑映射爲用戶使用的url。 `src/pages` 從 `src/views` 中調用可復用的視圖邏輯，`src/views`又再調用位於 `src/components` 的組件庫。

前端組件庫由 [React](https://reactjs.org/) 寫成，遵循[馬特市的設計系統](https://paper.dropbox.com/doc/Matters-3.0-Design-System--A46qkFNPV3eO8RwligsbqkDTAg-Sp6ANp5EXAdnzSK3adqNS)，並包含了很多通用的 [context](https://reactjs.org/docs/context.html)（例如當前用戶信息、全局語言設定）與強大的 [hooks](https://reactjs.org/docs/hooks-overview.html)（例如響應式設計、下拉更新）。後續我們將引入 [Storybook](https://storybook.js.org/) 等工具，讓組件庫更加一目了然，方便開發者直接修改和使用。

在 React 代碼風格上，我們大量使用函數式編程，藉助 [functional component](https://reactjs.org/docs/components-and-props.html#function-and-class-components) 讓代碼結構更加簡潔明瞭。需要調用數據的組件都有一個 `fragments` 欄位，包含了描述數據需求的 [GraphQL fragment](https://www.apollographql.com/docs/react/data/fragments/)。這樣，父組件可以不必考慮子組件的具體數據需求，直接在 query 中調用 fragment 即可。

正如 React 組件的相互調用形成了一個樹形結構，GraphQL fragment 的層層調用也形成了這樣的樹形結構，與 React 樹相互貼合。在 fragment 樹的頂端，是整合之後的 [query與mutation](https://graphql.org/learn/queries/)，均通過 [Apollo Client](https://www.apollographql.com/docs/react/) 發起。

Apollo Client 的配置位於 `src/common/utils/withApollo.ts` 中，由不同的 [Apollo Link](https://www.apollographql.com/docs/link/) 組成，包含了服務器 API 地址、身份校驗、[persisted queries](https://www.apollographql.com/docs/apollo-server/performance/apq/) 等邏輯。同時，裏面還有一些[客戶端的 GraphQL schema](https://www.apollographql.com/docs/react/local-state/client-side-schema/) 與 [resolver](https://www.apollographql.com/docs/react/local-state/managing-state-with-field-policies/)，讓我們也能通過 GraphQL 讀寫客戶端本地的數據，例如首頁文章瀑布流的選擇、文章評論的草稿。

文章編輯器單獨作爲一個項目，位於 [matters-editor](https://github.com/thematters/matters-editor) 中，基於 [Quill.js](https://quilljs.com/) 搭建。這一部分是前端交互最爲複雜的地方，也是最需要優化與改進之處，之後我們會專門撰文進行介紹。目前編輯器有很多 bug 沒有辦法復現，我們隨後也會專門邀請馬特市的市民們和我們一起來抓 bug。

# [後端](https://github.com/thematters/matters-server)

馬特市的後端依賴不少服務，結構相對複雜，我們在 GitHub 上繪製了[簡化的架構圖](https://github.com/thematters/developer-resource/blob/master/doc/architecture-diagram.png)。本地啓動時，[用 docker 來安裝和管理不同的服務](https://github.com/thematters/matters-server#docker)會方便一些。

後端的 GraphQL API 基於 [Apollo Server](https://github.com/apollographql/apollo-server)，提供了數據讀寫的入口，也定義了前後端共享的數據結構。決定API結構的 [GraphQL schema](https://graphql.org/learn/schema/) 位於 `src/types` 路徑下，其中的備註則會作爲文檔出現在 [Apollo Playground](https://server-test.matters.news/playground) 裡。

我們通過 [GraphQL directives](https://graphql.org/learn/queries/#directives) 來實現一些 schema 層面的通用邏輯，例如權限管理、緩存、操作頻率限制，位於 `src/types/directives` 路徑下。GraphQL directives 並不是一個非常常見的功能，但其實[非常強大](https://blog.logrocket.com/graphql-directives-are-underrated/)，能夠通過對聲明式的方式控制 schema 的解析過程，也能夠簡化代碼結構，我們後續也會增加對它的使用。

有句諺語說，計算機科學中最難的事莫過於緩存清理和命名；命名實在很難，不過我們花了不少精力調試緩存，並把實戰測試後的邏輯和代碼單獨抽到了[一個倉庫](https://github.com/thematters/apollo-response-cache)之中。裏面有一個 [plugin](https://www.apollographql.com/docs/apollo-server/integrations/plugins/) 和對應的幾個 directives ，實現了簡單的緩存與清理。GraphQL 服務器端緩存的精確清理一直比較薄弱，所以我們之後專門撰文介紹馬特市的解決方案，以方便其他項目直接使用。

GraphQL schema 的根節點分爲 [query 與 mutation](https://graphql.org/learn/schema/#the-query-and-mutation-types)，query 用於讀取數據，而 mutation 用於寫入數據。兩者的[執行邏輯](https://graphql.org/learn/execution/)都由 [resolver](https://www.apollographql.com/docs/apollo-server/data/resolvers/) 定義，分別位於 `src/query` 與 `src/mutation` 中。resolver 在執行的時候，從 [context](https://www.apollographql.com/docs/apollo-server/data/resolvers/#the-context-argument) 中調用 [data source](https://www.apollographql.com/docs/apollo-server/data/data-sources/)，向數據庫等服務發起具體的請求、進行計算。

不同的 data source 由 `src/connector` 中的文件定義，其中也包含了其他對接服務所需要的接口，比如 s3、Google 翻譯、ElasticSearch 等。其中， `queue` 路徑下存放了基於 Redis 的隊列操作，包括定期執行的操作（如數據庫更新）、限制並行的操作（如讚賞、支持與提現）等。隨着馬特市容量的擴大，未來會有越來越多的操作在隊列中異步完成。

在收到請求時，Apollo Server [將所有 data source 注入](https://github.com/thematters/matters-server/blob/develop/src/routes/graphql.ts#L95)到 context 中，由 resolver 進行調用。最頂層的這部分邏輯由 `src/routes` 中的文件定義，與 `oauth` 與 `pay` 兩個用於第三方認證和支付接入的 endpoint 並列。

# [排序算法與數據庫](https://github.com/thematters/matters-server/tree/develop/db)

馬特市裡內容的呈現，是用戶創作與行爲涌現的結果，而內容排序的邏輯則是涌現的規則，直接決定了什麼樣的內容被讀者看見。這些邏輯既是『好內容』的定義，也是『公共空間』的質地。

排序使用的數據來源於每一個用戶的行爲：對於文章，是讚賞、支持、評論、關聯、閱讀、收藏和精選；對於標籤，是編輯、精選和追蹤；對於作者，則是追蹤，以及對作者文章或標籤的所有行爲。每一項行爲都是一條時間序列，包含無數種切分時間的窗口；同時，每一位用戶又有不同的加權方式，比如追蹤者數、收到支持數、給出支持數，能夠給行爲賦予不同的權重。

排序算法需要利用這些多維的數據，涌現出受到認可的內容和作者，既要保證一定頻率的更新，又要避免惡意用戶的刷屏攻擊。這使得排序算法變得複雜而精細，也使得我們需要不斷地以簡潔易懂的方式溝通和改善排序邏輯，讓公共空間的質地真正成爲社區的共識。之後我們也會專門撰文介紹排序算法的思路，方便馬特市市民們的參與。

這些不同的排序都以 [materialized view](https://en.wikipedia.org/wiki/Materialized_view) 的形式存儲與數據庫中，通過 cron jobs 進行定期更新。數據庫的遷移、配置和 seeding 等文件存儲在 `db` 路徑下，與 `src` 路徑平行。排序方式的相關代碼則在 `db/migrations` 中，對應的 materialized view 經由不同的 resolver 調用呈現在 API 的返回結果中。

數據庫結構相對複雜，難以很快理解和上手。爲此，我們製作了[數據庫的文檔與結構圖](https://github.com/thematters/developer-resource/tree/master/doc)，下載文檔之後可以點開網頁，直觀地理解目前的數據庫結構。

# 開發環境與部署方式

因為馬特市只有很小的工程師團隊，所以我們盡力標準化本地開發規範、自動化 DevOps 操作，以便提升開發效率。

不管是前端後端，GraphQL 類別均會在開發與建構時生成對應的 TypeScript 類別，實現數據結構校驗：後端採用 [graphql-schema-typescript 項目](https://github.com/dangcuuson/graphql-schema-typescript#readme)，調用 `npm run gen` 來生成；前端則採用 [apollo-tooling項目](https://github.com/apollographql/apollo-tooling#apollo-clientcodegen-output)實現，調用 `npm run gen:type` 來生成。本地開發時，這些類別都會及時自動生成。

前後端在開發工具配置上也大致相同：[Prettier](https://prettier.io/) 用於自動規範代碼格式，[Commitzen](http://commitizen.github.io/cz-cli/) 用於規範 git commit 格式，[Jest](https://jestjs.io/) 則用於單元測試。前端倉庫 `[bdd](https://github.com/thematters/matters-web/tree/develop/bdd)`[路徑](https://github.com/thematters/matters-web/tree/develop/bdd)下還有 [cucumber](https://cucumber.io/) 文檔，既可以作為產品功能的文檔，也作為前後端整合測試的腳本；不過這部分尚未發揮出潛力，還有待開發和完善。

新版本的部署通過 GitHub action 完成，一方面將新版本的 git commit 自動整合為 release note，另一方面將新版代碼上傳到服務器中。隨著馬特市依賴的服務越來越複雜，我們開始嘗試採用 [Terraform](https://www.terraform.io/) 自動化基建的更改與調度，這一部分的進展會在之後更新。


---

以上便是馬特市目前的大致結構與思路，其中還有很多細節與側面，留待以後的文章介紹。歡迎你來提出自己的看法，不管是發現了什麼問題，還是有想進一步了解的部分。也歡迎報名[馬特市開源計畫的第一步](https://matters.news/@hi176/matters%E9%96%8B%E6%BA%90%E8%A8%88%E7%95%AB%E5%95%9F%E5%8B%95-%E9%82%80%E8%AB%8B%E4%BD%A0%E4%BE%86%E5%85%B1%E5%BB%BA%E9%A6%AC%E7%89%B9%E5%B8%82-bafyreiadaxjjwxk6mhsx4u6ognhxw3atlwiloscyn7r2iff6tsz4rrc4by)，搶先進入代碼倉庫玩玩看。

Happy Hacking ❤️

