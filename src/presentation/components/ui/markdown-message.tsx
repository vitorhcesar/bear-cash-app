import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { Lexer, type Token, type Tokens } from "marked";
import { useMemo } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  BearCashColors,
  BearCashFonts,
  BearCashTypography,
  Fonts,
} from "@/presentation/constants/theme";

const MARKED_OPTIONS = {
  gfm: true,
  breaks: true,
} as const;

type MarkdownMessageProps = {
  content: string;
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const tokens = useMemo(
    () => Lexer.lex(content, MARKED_OPTIONS),
    [content],
  );

  return (
    <View style={styles.root}>
      {tokens.map((token, index) => (
        <BlockToken key={`${token.type}-${index}`} token={token} />
      ))}
    </View>
  );
}

function BlockToken({ token }: { token: Token }) {
  switch (token.type) {
    case "space":
      return null;
    case "heading":
      return (
        <Text
          style={[styles.body, headingStyle(token.depth)]}
          accessibilityRole="header"
        >
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "paragraph":
      return (
        <Text style={styles.body}>
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "blockquote": {
      const children = token.tokens ?? [];
      return (
        <View style={styles.blockquote}>
          {children.map((child, index) => (
            <BlockToken key={`${child.type}-${index}`} token={child} />
          ))}
        </View>
      );
    }
    case "list":
      return <MarkdownList token={token as Tokens.List} />;
    case "code":
      return (
        <View style={styles.codeBlock}>
          {token.lang ? (
            <Text style={styles.codeLang}>{token.lang}</Text>
          ) : null}
          <Text style={styles.codeText}>{token.text.replace(/\n$/, "")}</Text>
        </View>
      );
    case "hr":
      return <View style={styles.hr} />;
    case "table":
      return <MarkdownTable token={token as Tokens.Table} />;
    case "html":
      return null;
    case "text":
      return (
        <Text style={styles.body}>
          {token.tokens ? (
            <InlineTokens tokens={token.tokens} />
          ) : (
            token.text
          )}
        </Text>
      );
    default:
      if ("tokens" in token && token.tokens?.length) {
        return (
          <View>
            {token.tokens.map((child, index) => (
              <BlockToken key={`${child.type}-${index}`} token={child} />
            ))}
          </View>
        );
      }
      if ("text" in token && typeof token.text === "string") {
        return <Text style={styles.body}>{token.text}</Text>;
      }
      return null;
  }
}

function MarkdownList({ token }: { token: Tokens.List }) {
  const start = typeof token.start === "number" ? token.start : 1;

  return (
    <View style={styles.list}>
      {token.items.map((item, index) => (
        <View key={`${item.raw}-${index}`} style={styles.listItem}>
          <Text style={styles.listMarker}>
            {item.task
              ? item.checked
                ? "☑"
                : "☐"
              : token.ordered
                ? `${start + index}.`
                : "•"}
          </Text>
          <View style={styles.listItemBody}>
            <ListItemContent item={item} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ListItemContent({ item }: { item: Tokens.ListItem }) {
  const tokens = item.tokens.filter((token) => token.type !== "space");
  const [first] = tokens;

  if (tokens.length === 1 && first?.type === "paragraph") {
    return (
      <Text style={styles.body}>
        <InlineTokens tokens={first.tokens} />
      </Text>
    );
  }

  if (tokens.length === 1 && first?.type === "text") {
    return (
      <Text style={styles.body}>
        {first.tokens ? <InlineTokens tokens={first.tokens} /> : first.text}
      </Text>
    );
  }

  return tokens.map((token, index) => (
    <BlockToken key={`${token.type}-${index}`} token={token} />
  ));
}

function MarkdownTable({ token }: { token: Tokens.Table }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        {token.header.map((cell, index) => (
          <Text
            key={`h-${index}`}
            style={[
              styles.tableCell,
              styles.tableHeaderCell,
              alignmentStyle(token.align[index]),
            ]}
          >
            <InlineTokens tokens={cell.tokens} />
          </Text>
        ))}
      </View>
      {token.rows.map((row, rowIndex) => (
        <View key={`r-${rowIndex}`} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <Text
              key={`c-${rowIndex}-${cellIndex}`}
              style={[
                styles.tableCell,
                alignmentStyle(token.align[cellIndex]),
              ]}
            >
              <InlineTokens tokens={cell.tokens} />
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function InlineTokens({ tokens }: { tokens?: Token[] }) {
  if (!tokens?.length) {
    return null;
  }

  return tokens.map((token, index) => (
    <InlineToken key={`${token.type}-${index}`} token={token} />
  ));
}

function InlineToken({ token }: { token: Token }) {
  switch (token.type) {
    case "text":
      return token.tokens ? (
        <InlineTokens tokens={token.tokens} />
      ) : (
        <Text>{token.text}</Text>
      );
    case "strong":
      return (
        <Text style={styles.strong}>
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "em":
      return (
        <Text style={styles.em}>
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "del":
      return (
        <Text style={styles.del}>
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "codespan":
      return <Text style={styles.codespan}>{token.text}</Text>;
    case "link":
      return (
        <Text
          accessibilityRole="link"
          style={styles.link}
          onPress={() => {
            void openMarkdownUrl(token.href);
          }}
        >
          <InlineTokens tokens={token.tokens} />
        </Text>
      );
    case "image":
      return <Text style={styles.em}>{token.text || token.href}</Text>;
    case "br":
      return <Text>{"\n"}</Text>;
    case "escape":
      return <Text>{token.text}</Text>;
    case "checkbox":
      return <Text>{token.checked ? "☑ " : "☐ "}</Text>;
    case "html":
      return null;
    default:
      if ("tokens" in token && token.tokens?.length) {
        return <InlineTokens tokens={token.tokens} />;
      }
      if ("text" in token && typeof token.text === "string") {
        return <Text>{token.text}</Text>;
      }
      return null;
  }
}

function headingStyle(depth: number) {
  if (depth <= 1) {
    return styles.h1;
  }
  if (depth === 2) {
    return styles.h2;
  }
  return styles.h3;
}

function alignmentStyle(align: Tokens.Table["align"][number]) {
  if (align === "center") {
    return styles.alignCenter;
  }
  if (align === "right") {
    return styles.alignRight;
  }
  return styles.alignLeft;
}

function isSafeUrl(href: string) {
  return /^(https?:|mailto:)/i.test(href);
}

async function openMarkdownUrl(href: string) {
  if (!isSafeUrl(href)) {
    return;
  }

  if (Platform.OS === "web") {
    await Linking.openURL(href);
    return;
  }

  await openBrowserAsync(href, {
    presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
  });
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  body: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.text,
  },
  h1: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: BearCashFonts.semiBold,
  },
  h2: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: BearCashFonts.semiBold,
  },
  h3: {
    fontFamily: BearCashFonts.semiBold,
  },
  strong: {
    fontFamily: BearCashFonts.semiBold,
  },
  em: {
    fontStyle: "italic",
  },
  del: {
    textDecorationLine: "line-through",
    color: BearCashColors.textMid,
  },
  link: {
    color: BearCashColors.primarySoft,
    textDecorationLine: "underline",
  },
  codespan: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: BearCashColors.primarySoft,
    backgroundColor: BearCashColors.background,
  },
  codeBlock: {
    backgroundColor: BearCashColors.background,
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  codeLang: {
    ...BearCashTypography.captionSmall,
    color: BearCashColors.textSoft,
    textTransform: "uppercase",
  },
  codeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: BearCashColors.textMid,
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  listMarker: {
    ...BearCashTypography.bodySmall,
    color: BearCashColors.primarySoft,
    minWidth: 18,
  },
  listItemBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: BearCashColors.primarySoft,
    paddingLeft: 10,
    gap: 6,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BearCashColors.borderSoft,
    marginVertical: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: BearCashColors.borderSoft,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BearCashColors.borderSoft,
  },
  tableHeaderRow: {
    backgroundColor: BearCashColors.background,
  },
  tableCell: {
    ...BearCashTypography.caption,
    color: BearCashColors.text,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tableHeaderCell: {
    fontFamily: BearCashFonts.semiBold,
    color: BearCashColors.textMid,
  },
  alignLeft: {
    textAlign: "left",
  },
  alignCenter: {
    textAlign: "center",
  },
  alignRight: {
    textAlign: "right",
  },
});
