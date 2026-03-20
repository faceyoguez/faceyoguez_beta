export const STATIC_COURSES = [
    {
        id: 'course_1',
        title: 'Face Yoga 21-Day Transformation',
        slug: '21-day-transformation',
        description: 'The Glow-Up Your Skin Has Been Waiting For. Ancient muscle movement meets modern glow science.',
        level: 'Level 1',
        thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800',
        is_active: true,
        modules: [
            {
                id: 'mod_1',
                title: 'The Foundation',
                order_index: 1,
                lessons: [
                    {
                        id: 'les_1',
                        module_id: 'mod_1',
                        title: 'Welcome to Your Transformation',
                        slug: 'welcome',
                        video_url: 'dQw4w9WgXcQ',
                        youtube_id: 'dQw4w9WgXcQ',
                        content: '<h2>Your Journey Begins</h2><p>Welcome to the 21-day ritual. This session covers the basics of facial muscle engagement.</p>',
                        order_index: 1,
                        is_free_preview: true
                    },
                    {
                        id: 'les_2',
                        module_id: 'mod_1',
                        title: 'The Anatomy of Glow',
                        slug: 'anatomy-of-glow',
                        video_url: 'ScMzIvxBSi4',
                        youtube_id: 'ScMzIvxBSi4',
                        content: '<h2>Understanding Your Muscles</h2><p>Learn about the 43 muscles in your face and how they hold tension.</p>',
                        order_index: 2
                    }
                ]
            },
            {
                id: 'mod_2',
                title: 'Sculpting & Toning',
                order_index: 2,
                lessons: [
                    {
                        id: 'les_3',
                        module_id: 'mod_2',
                        title: 'Jawline Definition Ritual',
                        slug: 'jawline-ritual',
                        video_url: '60ItHLz5WEA',
                        youtube_id: '60ItHLz5WEA',
                        content: '<h2>Sculpting the Lower Face</h2><p>A deep-dive into toning the platysma and masseter muscles.</p>',
                        order_index: 1
                    }
                ]
            }
        ]
    },
    {
        id: 'course_2',
        title: 'Masterclass: Cheekbone Lift',
        slug: 'cheekbone-lift',
        description: 'Advanced sculpting techniques for defined cheekbones.',
        level: 'Masterclass',
        thumbnail_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&q=80&w=800',
        is_active: true,
        modules: []
    }
];
