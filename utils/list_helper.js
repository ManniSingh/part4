
const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((a,b)=>a+b.likes,0)
}

const favoriteBlog = (blogs) => {
    if (blogs.length>0) {
        let blog = blogs[0]
        for (const _blog of blogs){
            if (_blog.likes>blog.likes){
                blog=_blog
            }
        }
        return blog
    }
    return 0
}

const maxIndex = (arr) => {
    let max = 0
    let maxIndex = 0
    for (let i = 0; i < arr.length; i++){
        if (arr[i]>max){
            max=arr[i]
            maxIndex=i
        }
    }
    return maxIndex
}

const mostBlogs = (blogs) => {
    if (blogs.length==0){
        return 0
    }
    authors = []
    num = []
    for (const _blog of blogs){
        if (authors.includes(_blog.author)) {
            let index = authors.indexOf(_blog.author)
            num.fill(num[index]+1,index,index+1)
        } else{
            authors.push(_blog.author)
            num.push(1)
        }
    }
    const index = maxIndex(num)
    return {author:authors[index],blogs:num[index]}
}

const mostLikes = (blogs) => {
    if (blogs.length==0){
        return 0
    }
    authors = []
    num = []
    for (const _blog of blogs){
        if (authors.includes(_blog.author)) {
            let index = authors.indexOf(_blog.author)
            num.fill(num[index]+_blog.likes,index,index+1)
        } else{
            authors.push(_blog.author)
            num.push(_blog.likes)
        }
    }
    const index = maxIndex(num)
    return {author:authors[index],likes:num[index]}
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}