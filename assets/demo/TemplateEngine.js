/**
* @Author: Hankszhang
* @Date:   2016-09-11
* @Last modified by:   Hankszhang
* @Last modified time: 2016-09-11
* Cite from https://github.com/krasimir/absurd/blob/master/lib/processors/html/helpers/TemplateEngine.js
*/

module.exports = function(html, options) {
    var re = /<%(.+?)%>/g,
        reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
        code = 'var r=[];\n',
        cursor = 0,
        result;
    var add = function(line, js) {
        js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        // 返回函数本身，使得可以连续调用
        return add;
    }
    while (match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    try {
        result = new Function(code.replace(/[\r\t\n]/g, ' ')).apply(options);
    }
    catch (err) {
        console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n");
    }
    return result;
}</%(.+?)%>