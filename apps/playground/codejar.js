/*jslint browser */

import {CodeJar} from "https://esm.sh/codejar@4.2.0";
import tokenize from "https://ufork.org/lib/asm_tokenize.js";
import parse from "https://ufork.org/lib/asm_parse.js";

function entityify(string) {

// The 'entityify' function escapes any potentially dangerous characters in a
// string that is to be interpreted as HTML.

    return string.replace(
        /&/g,
        "&amp;"
    ).replace(
        /</g,
        "&lt;"
    ).replace(
        />/g,
        "&gt;"
    ).replace(
        /\\/g,
        "&bsol;"
    ).replace(
        /"/g,
        "&quot;"
    );
}

function alter_string(string, alterations) {

// The 'alter_string' function applies an array of substitutions to a string.
// The ranges of the alterations must be disjoint. The 'alterations' parameter
// is an array of arrays like [range, replacement] where the range is an object
// like {start, end}.

    alterations = alterations.slice().sort(function compare(a, b) {
        return a[0].start - b[0].start || a[0].end - b[0].end;
    });
    let end = 0;
    return alterations.map(function ([range, replacement]) {
        const chunk = string.slice(end, range.start) + replacement;
        end = range.end;
        return chunk;
    }).concat(
        string.slice(end)
    ).join(
        ""
    );
}

function highlight(element) {
    const source = element.textContent;
    const ast = parse(tokenize(source));
    let alterations = [];
    ast.tokens.forEach(function (token) {
        const errors = ast.errors.filter(function (error) {
            return token.start >= error.start && token.end <= error.end;
        });
        const title = errors.map(function (error) {
            return error.message;
        }).join(
            "\n"
        );
        const classes = (
            token.kind.length === 1
            ? "separator"
            : token.kind
        ) + (
            errors.length > 0
            ? " warning"
            : ""
        );
        const text = source.slice(token.start, token.end);
        alterations.push([
            token,
            (
                "<span class=\""
                + classes
                + "\" title=\""
                + entityify(title)
                + "\">"
                + entityify(text)
                + "</span>"
            )
        ]);
    });
    element.innerHTML = alter_string(source, alterations);
}

const jar = new CodeJar(
    document.getElementById("editor"),
    highlight,
    {tab: "    "}
);

function fetch_source() {
    const src = new URL(location.href).searchParams.get("src");
    return (
        src
        ? fetch(src).then(function (response) {
            return (
                response.ok
                ? response.text()
                : Promise.reject(new Error(response.status))
            );
        })
        : Promise.resolve("; Write some uFork assembly here...")
    );
}

fetch_source().then(function (source) {
    jar.updateCode(source);
}).catch(function (error) {
    window.alert("Failed to load source: " + error.message);
});