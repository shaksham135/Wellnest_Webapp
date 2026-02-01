
const STORAGE_KEY = 'wellnest_blog_posts';


const initialPosts = [
    {
        id: '1',
        title: 'Top 10 Superfoods for a Healthy Heart',
        excerpt: 'Discover the power of berries, nuts, and leafy greens in maintaining cardiovascular health.',
        content: 'Cardiovascular health is crucial for a long life. Incorporating superfoods like blueberries, kale, and almonds can significantly reduce the risk of heart disease...',
        author: 'Dr. Sarah Smith',
        role: 'Admin',
        date: '2023-10-25',
        likes: 124,
        comments: [
            { id: 'c1', user: 'Jane Doe', text: 'Great article! I love almonds.', date: '2023-10-26' }
        ],
        category: 'Nutrition',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop'
    },
    {
        id: '2',
        title: '5-Minute Morning Yoga Routine',
        excerpt: 'Start your day with energy and focus using these simple yoga poses.',
        content: 'Yoga is not just about flexibility; it is about mindfulness. These 5 poses will help you wake up your body and mind...',
        author: 'Mike Ross',
        role: 'Trainer',
        date: '2023-10-28',
        likes: 89,
        comments: [],
        category: 'Fitness',
        image: 'https://images.unsplash.com/photo-1544367563-121955377568?q=80&w=2000&auto=format&fit=crop'
    },
    {
        id: '3',
        title: 'The Importance of Mental Breaks',
        excerpt: 'Why taking time off is essential for productivity and mental well-being.',
        content: 'Burnout is real. In this fast-paced world, taking mental breaks is not a luxury, it is a necessity...',
        author: 'Emily Blunt',
        role: 'Verified User',
        date: '2023-11-01',
        likes: 215,
        comments: [],
        category: 'Mental Wellness',
        image: 'https://images.unsplash.com/photo-1493612276216-9c59019558f7?q=80&w=2000&auto=format&fit=crop'
    }
];

export const getPosts = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialPosts));
        return initialPosts;
    }
    return JSON.parse(stored);
};

export const getPostById = (id) => {
    const posts = getPosts();
    return posts.find(p => p.id === id);
};

export const createPost = (post) => {
    const posts = getPosts();
    const newPost = {
        ...post,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        comments: [],
        role: 'User'
    };
    const updatedPosts = [newPost, ...posts];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return newPost;
};

export const updatePost = (id, updatedFields) => {
    const posts = getPosts();
    const updatedPosts = posts.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts.find(p => p.id === id);
};

export const deletePost = (id) => {
    const posts = getPosts();
    const updatedPosts = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
};

export const toggleLike = (id) => {
    const posts = getPosts();
    const updatedPosts = posts.map(p => {
        if (p.id === id) {
            // Simple toggle mock showing like count increment/decrement
            return { ...p, likes: p.likes + 1 };
        }
        return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts.find(p => p.id === id);
};

export const addComment = (postId, commentText, userName = 'You') => {
    const posts = getPosts();
    const updatedPosts = posts.map(p => {
        if (p.id === postId) {
            const newComment = {
                id: Date.now().toString(),
                user: userName,
                text: commentText,
                date: new Date().toISOString().split('T')[0]
            };
            return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
    return updatedPosts.find(p => p.id === postId).comments;
};
