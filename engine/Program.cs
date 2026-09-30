using System;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

internal static class Program
{
    public static void Main(string[] args)
    {
        try
        {
            var pattern = args[0];
            var input = args[1];
            var replacement = args[2];
            var options = (RegexOptions)int.Parse(args[3], CultureInfo.InvariantCulture);
            var start = int.Parse(args[4], CultureInfo.InvariantCulture);
            var limit = int.Parse(args[5], CultureInfo.InvariantCulture);
            var mode = args[6];
            var regex = new Regex(pattern, options | RegexOptions.CultureInvariant, TimeSpan.FromMilliseconds(1000));
            var result = new StringBuilder("{\"matches\":[");
            var match = regex.Match(input, start);
            var count = 0;
            while (match.Success && count < limit)
            {
                if (count > 0) result.Append(',');
                result.Append("{\"index\":").Append(match.Index).Append(",\"length\":").Append(match.Length);
                result.Append(",\"value\":");
                WriteString(result, match.Value);
                result.Append(",\"groups\":[");
                var numbers = regex.GetGroupNumbers();
                for (var i = 0; i < numbers.Length; i++)
                {
                    if (i > 0) result.Append(',');
                    var group = match.Groups[numbers[i]];
                    result.Append("{\"name\":");
                    WriteString(result, regex.GroupNameFromNumber(numbers[i]));
                    result.Append(",\"success\":").Append(group.Success ? "true" : "false");
                    result.Append(",\"value\":");
                    WriteString(result, group.Value);
                    result.Append(",\"captures\":[");
                    for (var c = 0; c < group.Captures.Count; c++)
                    {
                        if (c > 0) result.Append(',');
                        var capture = group.Captures[c];
                        result.Append("{\"index\":").Append(capture.Index).Append(",\"length\":").Append(capture.Length).Append(",\"value\":");
                        WriteString(result, capture.Value);
                        result.Append('}');
                    }
                    result.Append("]}");
                }
                result.Append("]}");
                count++;
                match = match.NextMatch();
            }
            result.Append("],\"truncated\":").Append(match.Success ? "true" : "false");
            if (mode == "replace")
            {
                result.Append(",\"replacement\":");
                WriteString(result, regex.Replace(input, replacement, limit, start));
            }
            if (mode == "split")
            {
                result.Append(",\"split\":[");
                var split = regex.Split(input, limit, start);
                for (var i = 0; i < split.Length; i++)
                {
                    if (i > 0) result.Append(',');
                    WriteString(result, split[i]);
                }
                result.Append(']');
            }
            result.Append('}');
            Console.WriteLine(result.ToString());
        }
        catch (RegexParseException error)
        {
            var result = new StringBuilder("{\"error\":");
            WriteString(result, "Invalid pattern at position " + error.Offset + ": " + error.Error.ToString());
            Console.WriteLine(result.Append('}').ToString());
        }
        catch (RegexMatchTimeoutException)
        {
            Console.WriteLine("{\"error\":\"The regex exceeded the 1 second matching timeout. Try simplifying the pattern or shortening the input.\"}");
        }
        catch (Exception error)
        {
            var result = new StringBuilder("{\"error\":");
            WriteString(result, error.Message);
            Console.WriteLine(result.Append('}').ToString());
        }
    }

    private static void WriteString(StringBuilder output, string value)
    {
        output.Append('"');
        foreach (var character in value)
        {
            switch (character)
            {
                case '"': output.Append("\\\""); break;
                case '\\': output.Append("\\\\"); break;
                case '\n': output.Append("\\n"); break;
                case '\r': output.Append("\\r"); break;
                case '\t': output.Append("\\t"); break;
                default:
                    if (character < ' ' || char.IsSurrogate(character))
                        output.Append("\\u").Append(((int)character).ToString("x4", CultureInfo.InvariantCulture));
                    else output.Append(character);
                    break;
            }
        }
        output.Append('"');
    }
}
