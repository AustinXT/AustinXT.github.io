# 公众号发布流程


{{< mermaid >}}
sequenceDiagram
    participant T as Typora
    participant C as Chrome
    participant P as PicGo
    loop 写作
        T-->>T: 写作
        C-->>P: 图片上传图床
        P-->>T: 插图图片
    end
    opt 发布文章
        T->>C: 复制Markdown源码至公众号
        C->>C: Markdown Here 插件，一键格式化
        C->>C: 发布文章
    end
    opt 导出
        T->>T: pandoc 导出docs/pdf/png
    end
{{< /mermaid >}}
