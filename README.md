# [Bionify - Read Faster!](https://bionify.xyz)

**LEGAL NOTICE:** To the _wonderful_ folks at Bionic Reading®, this is not a pirated version of your Bionic Reading® API, but rather a simple algorithm I developed in conjunction with other open source developers. It does NOT violate your precious Bionic Reading® copyrights.

[![banner](src/icons/marquee.png)](https://chrome.google.com/webstore/detail/bionify-read-faster-with/gomhfpbcjfidhpffhecghfdieincgncc)

A simple chrome extension designed to help you read faster and more efficiently.

## Download

Bionify is available on the Chrome web store!

Get it here: https://chrome.google.com/webstore/detail/bionify-read-faster-with/gomhfpbcjfidhpffhecghfdieincgncc

## Development

First, clone the repository

```
git clone https://github.com/cveinnt/bionify.git
```

Thenm, follow [this instruction](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked) to develop unpacked extensions in Chrome.

## Algorithm Specification

We allow you to customize highlight algorithm using a string similar to this:

```
- 0 1 1 2 0.4
```

Note that all numbers and characters are separated by a space. Here is what this string means:

```
- 0 1 1 2 0.4
^
```

The first character can be either `-` or `+`. If it is `-`, we don't highlight common english words (for example 'a', 'and', etc.) if it is '+' we highlight all words.

```
- 0 1 1 2 0.4
  ^
```

This specifies the number of highlighted characters for words with length 1. For example 'a' and 'I'. Here we have specified that we don't want to highlight these characters.

```
- 0 1 1 2 0.4
    ^
```

This specifies the number of highlighted characters for words with length 2. For example 'an' and 'or'. Here we have specified that we highlight the first character of these words.

```
- 0 1 1 2 0.4
      ^
```

Highlight the first character of 3 letter words.

```
- 0 1 1 2 0.4
        ^
```

Highlight the first two character of 4 letter words.

```
- 0 1 1 2 0.4
           ^
```

Unlike the previews entries, the last entry is a fractional value between 0 and 1 which specified which fraction of words that are not specified by previous rules must be highlighted.
For example, here we highlight the first 40% characters of words with 5 or more characters.

## Credit

Bionify is a published fork of [fastread](https://github.com/ahrm/chrome-fastread).
