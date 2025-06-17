const express = require('express');
const router = express.Router();
const Article = require('../../models/unit_models/article'); // Import the Article model
const Video = require('../../models/unit_models/video'); // Import the Video model
const Interview = require('../../models/unit_models/interview'); // Import the Interview model
const PromptSet = require('../../models/unit_models/promptset');
const Exercise = require('../../models/unit_models/exercise');
const Template = require('../../models/unit_models/template');
const unitFormController = require('../../controllers/unitformController');
const ensureAuthenticated = require('../../middleware/ensureAuthenticated');
const isDevelopment = process.env.NODE_ENV !== 'production';
const uploadDocs = require('../../middleware/multerDocuments');
const csrf = require('csurf');
const csrfProtection = csrf();


// Debugging the ensureAuthenticated function
console.log('ensureAuthenticated:', ensureAuthenticated);
console.log('ensureAuthenticated is a function:', typeof ensureAuthenticated === 'function'); // Should log true

console.log('unitFormController:', unitFormController);

// Article Form Routes
router.get('/form_article', ensureAuthenticated, unitFormController.getArticleForm);

router.get('/edit_article/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Edit form requested for article ID: ${id}`); // Debugging log

        const article = await Article.findById(id).populate({
            path: 'author.id',
            model: 'Member',
            select: 'name profileImage',
        });

        if (!article) {
            console.warn(`Article with ID ${id} not found.`);
            return res.status(404).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Article Not Found',
                errorMessage: `The article with ID ${id} does not exist.`,
            });
        }

        const mainTopics = [
            'Career Development in Technical Services',
            'Soft Skills in Technical Environments',
            'Project Management',
            'Business Development in Technical Services',
            'Proposal Management',
            'Proposal Strategy',
            'Storytelling in Technical Marketing',
            'Client Experience',
            'Social Media, Advertising, and Other Mysteries',
            'Emotional Intelligence',
            'The Pareto Principle or 80/20',
            'Diversity and Inclusion in Consulting',
            'People Before Profit',
            'Non-Technical Roles in Technical Environments',
            'Leadership in Technical Services',
            'The Advantage of Failure',
            'Social Entrepreneurship',
            'Employee Experience',
            'Project Management Software',
            'CRM Platforms',
            'Client Feedback Software',
            'Workplace Culture',
            'Mental Health in Consulting Environments',
            'Remote and Hybrid Work',
            'Four Day Work Week',
            'The Power of Play in the Workplace',
            'Team Building in Consulting',
            'AI in Consulting',
            'AI in Project Management',
            'AI in Learning',
        ];

        // Ensure all topics (both selected and unselected) are available
        const secondaryTopics = mainTopics.map((topic) => ({
            name: topic,
            selected: article.secondary_topics?.includes(topic) || false,
        }));

        res.render('unit_form_views/form_article', {
            layout: 'unitformlayout',
            data: {
                ...article.toObject(),
                author: {
                    name: article.author?.id?.name || 'Unknown Author',
                    image: article.author?.id?.profileImage || '/images/default-avatar.png',
                },
            },
            mainTopics,
            secondaryTopics, // Pass secondary topics for dynamic rendering
            csrfToken: isDevelopment ? null : req.csrfToken(),
        });
    } catch (error) {
        console.error(`Error loading edit form for article ID ${req.params.id}:`, error);
        res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the edit form.',
        });
    }
});


router.post('/submit_article', ensureAuthenticated, unitFormController.submitArticle);



router.get('/edit_promptset/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Edit form requested for prompt set ID: ${id}`);

        // Fetch the prompt set by ID
        const promptSet = await PromptSet.findById(id);

        if (!promptSet) {
            console.warn(`Prompt set with ID ${id} not found.`);
            return res.status(404).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Prompt Set Not Found',
                errorMessage: `The prompt set with ID ${id} does not exist.`,
            });
        }

        console.log('Prompt set fetched successfully:', promptSet);

        // Prepopulate the form with the fetched data
        res.render('unit_form_views/form_promptset', {
            layout: 'unitformlayout',
            data: {
                ...promptSet.toObject(),
            },
            mainTopics: [
                'Career Development in Technical Services',
                'Soft Skills in Technical Environments',
                'Project Management',
                'Business Development in Technical Services',
                'Proposal Management',
                'Proposal Strategy',
                'Storytelling in Technical Marketing',
                'Client Experience',
                'Social Media, Advertising, and Other Mysteries',
                'Emotional Intelligence',
                'The Pareto Principle or 80/20',
                'Diversity and Inclusion in Consulting',
                'People Before Profit',
                'Non-Technical Roles in Technical Environments',
                'Leadership in Technical Services',
                'The Advantage of Failure',
                'Social Entrepreneurship',
                'Employee Experience',
                'Project Management Software',
                'CRM Platforms',
                'Client Feedback Software',
                'Workplace Culture',
                'Mental Health in Consulting Environments',
                'Remote and Hybrid Work',
                'Four Day Work Week',
                'The Power of Play in the Workplace',
                'Team Building in Consulting',
                'AI in Consulting',
                'AI in Project Management',
                'AI in Learning',
            ],
            secondaryTopics: [
                'Career Development in Technical Services',
                'Soft Skills in Technical Environments',
                'Project Management',
                'Business Development in Technical Services',
                'Proposal Management',
                'Proposal Strategy',
                'Storytelling in Technical Marketing',
                'Client Experience',
                'Social Media, Advertising, and Other Mysteries',
                'Emotional Intelligence',
                'The Pareto Principle or 80/20',
                'Diversity and Inclusion in Consulting',
                'People Before Profit',
                'Non-Technical Roles in Technical Environments',
                'Leadership in Technical Services',
                'The Advantage of Failure',
                'Social Entrepreneurship',
                'Employee Experience',
                'Project Management Software',
                'CRM Platforms',
                'Client Feedback Software',
                'Workplace Culture',
                'Mental Health in Consulting Environments',
                'Remote and Hybrid Work',
                'Four Day Work Week',
                'The Power of Play in the Workplace',
                'Team Building in Consulting',
                'AI in Consulting',
                'AI in Project Management',
                'AI in Learning',
            ],
            frequencies: ['daily', 'weekly', 'monthly', 'quarterly'],
            characteristics: [
                'educational',
                'motivational',
                'provocative',
                'fun',
                'hilarious',
                'silly',
                'competitive',
                'restorative',
                'energizing',
                'relationship-building',
                'team building',
                'stress-relieving',
                'insightful',
                'calming',
                'reassuring',
                'encouraging',
                'creative',
                'imaginative',
                'heart-warming',
                'other',
            ],
            csrfToken: isDevelopment ? null : req.csrfToken(),
        });
    } catch (error) {
        console.error(`Error loading edit form for prompt set ID ${req.params.id}:`, error);
        res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the edit form.',
        });
    }
});


// Video Form Routes
router.get('/form_video', ensureAuthenticated, unitFormController.getVideoForm);

// Edit Video Route
router.get('/edit_video/:id', ensureAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Edit form requested for video ID: ${id}`);
  
      const video = await Video.findById(id).populate({
        path: 'author.id',
        model: 'Member',
        select: 'name profileImage',
      });
  
      if (!video) {
        console.warn(`Video with ID ${id} not found.`);
        return res.status(404).render('unit_form_views/error', {
          layout: 'unitformlayout',
          title: 'Video Not Found',
          errorMessage: `The video with ID ${id} does not exist.`,
        });
      }
  
      const mainTopics = [
        'Career Development in Technical Services',
        'Soft Skills in Technical Environments',
        'Project Management',
        'Business Development in Technical Services',
        'Proposal Management',
        'Proposal Strategy',
        'Storytelling in Technical Marketing',
        'Client Experience',
        'Social Media, Advertising, and Other Mysteries',
        'Emotional Intelligence',
        'The Pareto Principle or 80/20',
        'Diversity and Inclusion in Consulting',
        'People Before Profit',
        'Non-Technical Roles in Technical Environments',
        'Leadership in Technical Services',
        'The Advantage of Failure',
        'Social Entrepreneurship',
        'Employee Experience',
        'Project Management Software',
        'CRM Platforms',
        'Client Feedback Software',
        'Workplace Culture',
        'Mental Health in Consulting Environments',
        'Remote and Hybrid Work',
        'Four Day Work Week',
        'The Power of Play in the Workplace',
        'Team Building in Consulting',
        'AI in Consulting',
        'AI in Project Management',
        'AI in Learning',
      ];
  
      const secondaryTopics = mainTopics.map((topic) => ({
        name: topic,
        selected: video.secondary_topics?.includes(topic) || false,
      }));
  
      res.render('unit_form_views/form_video', {
        layout: 'unitformlayout',
        data: {
          _id: video._id.toString(),
          video_title: video.video_title,
          short_summary: video.short_summary,
          full_summary: video.full_summary,
          video_content: video.video_content,
          main_topic: video.main_topic,
          secondary_topics: video.secondary_topics,
          sub_topic: video.sub_topic,
          clarify_topic: video.clarify_topic,
          produce_deliverables: video.produce_deliverables,
          new_ideas: video.new_ideas,
          engaging: video.engaging,
          permission: video.permission,
          visibility: video.visibility,
        },
        mainTopics,
        secondaryTopics,
        csrfToken: isDevelopment ? null : req.csrfToken(),
      });
      
    } catch (error) {
      console.error(`Error loading edit form for video ID ${req.params.id}:`, error);
      res.status(500).render('unit_form_views/error', {
        layout: 'unitformlayout',
        title: 'Error',
        errorMessage: 'An error occurred while loading the edit form.',
      });
    }
  });
  

router.post('/submit_video', ensureAuthenticated, unitFormController.submitVideo);

// Interview Form Routes
router.get('/form_interview', ensureAuthenticated, unitFormController.getInterviewForm);

router.get('/edit_interview/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Edit form requested for interview ID: ${id}`);

        const interview = await Interview.findById(id).populate({
            path: 'author.id',
            model: 'Member',
            select: 'name profileImage',
        });

        if (!interview) {
            console.warn(`Interview with ID ${id} not found.`);
            return res.status(404).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Interview Not Found',
                errorMessage: `The interview with ID ${id} does not exist.`,
            });
        }

        const authorData = interview.author?.id
            ? {
                  name: interview.author.id.name || 'Unknown Author',
                  image: interview.author.id.profileImage || '/images/default-avatar.png',
              }
            : {
                  name: 'Unknown Author',
                  image: '/images/default-avatar.png',
              };

        res.render('unit_form_views/form_interview', {
            layout: 'unitformlayout',
            data: {
                ...interview.toObject(),
                author: authorData,
            },
            mainTopics: [
        'Career Development in Technical Services',
        'Soft Skills in Technical Environments',
        'Project Management',
        'Business Development in Technical Services',
        'Proposal Management',
        'Proposal Strategy',
        'Storytelling in Technical Marketing',
        'Client Experience',
        'Social Media, Advertising, and Other Mysteries',
        'Emotional Intelligence',
        'The Pareto Principle or 80/20',
        'Diversity and Inclusion in Consulting',
        'People Before Profit',
        'Non-Technical Roles in Technical Environments',
        'Leadership in Technical Services',
        'The Advantage of Failure',
        'Social Entrepreneurship',
        'Employee Experience',
        'Project Management Software',
        'CRM Platforms',
        'Client Feedback Software',
        'Workplace Culture',
        'Mental Health in Consulting Environments',
        'Remote and Hybrid Work',
        'Four Day Work Week',
        'The Power of Play in the Workplace',
        'Team Building in Consulting',
        'AI in Consulting',
        'AI in Project Management',
        'AI in Learning',
            ],
            csrfToken: isDevelopment ? null : req.csrfToken(),
        });
    } catch (error) {
        console.error(`Error loading edit form for interview ID ${req.params.id}:`, error);
        res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the edit form.',
        });
    }
});

router.post('/submit_interview', ensureAuthenticated, unitFormController.submitInterview);


// Route to display the template form (Create New)
router.get('/form_template', ensureAuthenticated, csrfProtection, unitFormController.getTemplateForm);


// Route to display the edit form for an existing template
router.get('/edit_template/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Edit form requested for template ID: ${id}`); // Debugging log

        const template = await Template.findById(id).populate({
            path: 'author.id',
            model: 'Member',
            select: 'name profileImage',
        });

        if (!template) {
            console.warn(`Template with ID ${id} not found.`);
            return res.status(404).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Template Not Found',
                errorMessage: `The template with ID ${id} does not exist.`,
            });
        }

        const mainTopics = [
            'Career Development in Technical Services',
            'Soft Skills in Technical Environments',
            'Project Management',
            'Business Development in Technical Services',
            'Proposal Management',
            'Proposal Strategy',
            'Storytelling in Technical Marketing',
            'Client Experience',
            'Social Media, Advertising, and Other Mysteries',
            'Emotional Intelligence',
            'The Pareto Principle or 80/20',
            'Diversity and Inclusion in Consulting',
            'People Before Profit',
            'Non-Technical Roles in Technical Environments',
            'Leadership in Technical Services',
            'The Advantage of Failure',
            'Social Entrepreneurship',
            'Employee Experience',
            'Project Management Software',
            'CRM Platforms',
            'Client Feedback Software',
            'Workplace Culture',
            'Mental Health in Consulting Environments',
            'Remote and Hybrid Work',
            'Four Day Work Week',
            'The Power of Play in the Workplace',
            'Team Building in Consulting',
            'AI in Consulting',
            'AI in Project Management',
            'AI in Learning',
        ];

        // Ensure all topics (both selected and unselected) are available
        const secondaryTopics = mainTopics.map((topic) => ({
            name: topic,
            selected: template.secondary_topics?.includes(topic) || false,
        }));

        res.render('unit_form_views/form_template', {
            layout: 'unitformlayout',
            data: template.toObject(), // this makes everything accessible as data.xyz
            mainTopics,
            secondaryTopics,
            csrfToken: isDevelopment ? null : req.csrfToken()
          });
          
    } catch (error) {
        console.error(`Error loading edit form for template ID ${req.params.id}:`, error);
        res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the edit form.',
        });
    }
});

// Route to handle form submission for templates

router.post(
    '/submit_template',
    ensureAuthenticated,
    uploadDocs.array('document_uploads', 3), // ✅ multer first
    csrfProtection,                          // ✅ csrf second
    unitFormController.submitTemplate
  );
  
  
  
  



router.get('/form_promptset', ensureAuthenticated, unitFormController.getPromptForm);

router.get('/edit_promptset/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Edit form requested for prompt set ID: ${id}`);
        const promptSet = await PromptSet.findById(id).populate({
            path: 'author.id',
            model: 'Member',
            select: 'name profileImage',
        });

        if (!promptSet) {
            console.warn(`Prompt set with ID ${id} not found.`);
            return res.status(404).render('unit_form_views/error', {
                layout: 'unitformlayout',
                title: 'Prompt Set Not Found',
                errorMessage: `The prompt set with ID ${id} does not exist.`,
            });
        }

        res.render('unit_form_views/form_promptset', {
            layout: 'unitformlayout',
            data: {
                ...promptSet.toObject(),
                author: promptSet.author?.id || {
                    name: 'Unknown Author',
                    image: '/images/default-avatar.png',
                },
            },
            mainTopics: [
        'Career Development in Technical Services',
        'Soft Skills in Technical Environments',
        'Project Management',
        'Business Development in Technical Services',
        'Proposal Management',
        'Proposal Strategy',
        'Storytelling in Technical Marketing',
        'Client Experience',
        'Social Media, Advertising, and Other Mysteries',
        'Emotional Intelligence',
        'The Pareto Principle or 80/20',
        'Diversity and Inclusion in Consulting',
        'People Before Profit',
        'Non-Technical Roles in Technical Environments',
        'Leadership in Technical Services',
        'The Advantage of Failure',
        'Social Entrepreneurship',
        'Employee Experience',
        'Project Management Software',
        'CRM Platforms',
        'Client Feedback Software',
        'Workplace Culture',
        'Mental Health in Consulting Environments',
        'Remote and Hybrid Work',
        'Four Day Work Week',
        'The Power of Play in the Workplace',
        'Team Building in Consulting',
        'AI in Consulting',
        'AI in Project Management',
        'AI in Learning',
            ],
            csrfToken: isDevelopment ? null : req.csrfToken(),
        });
    } catch (error) {
        console.error(`Error loading edit form for prompt set ID ${req.params.id}:`, error);
        res.status(500).render('unit_form_views/error', {
            layout: 'unitformlayout',
            title: 'Error',
            errorMessage: 'An error occurred while loading the edit form.',
        });
    }
});

router.post('/submit_promptset', ensureAuthenticated, unitFormController.submitPromptSet);

// Exercise Routes
router.get('/form_exercise', ensureAuthenticated, csrfProtection, unitFormController.getExerciseForm);


router.get('/edit_exercise/:id', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Edit form requested for exercise ID: ${id}`);
      const exercise = await Exercise.findById(id).populate({
        path: 'author.id',
        model: 'Member',
        select: 'name profileImage',
      });
  
      if (!exercise) {
        return res.status(404).render('unit_form_views/error', {
          layout: 'unitformlayout',
          title: 'Exercise Not Found',
          errorMessage: `The exercise with ID ${id} does not exist.`,
        });
      }
  
      res.render('unit_form_views/form_exercise', {
        layout: 'unitformlayout',
        data: {
          ...exercise.toObject(),
          author: exercise.author?.id || {
            name: 'Unknown Author',
            image: '/images/default-avatar.png',
          },
        },
        mainTopics: [
        'Career Development in Technical Services',
        'Soft Skills in Technical Environments',
        'Project Management',
        'Business Development in Technical Services',
        'Proposal Management',
        'Proposal Strategy',
        'Storytelling in Technical Marketing',
        'Client Experience',
        'Social Media, Advertising, and Other Mysteries',
        'Emotional Intelligence',
        'The Pareto Principle or 80/20',
        'Diversity and Inclusion in Consulting',
        'People Before Profit',
        'Non-Technical Roles in Technical Environments',
        'Leadership in Technical Services',
        'The Advantage of Failure',
        'Social Entrepreneurship',
        'Employee Experience',
        'Project Management Software',
        'CRM Platforms',
        'Client Feedback Software',
        'Workplace Culture',
        'Mental Health in Consulting Environments',
        'Remote and Hybrid Work',
        'Four Day Work Week',
        'The Power of Play in the Workplace',
        'Team Building in Consulting',
        'AI in Consulting',
        'AI in Project Management',
        'AI in Learning',
        ],
        csrfToken: req.csrfToken(), // ✅ always pass the token
      });
    } catch (error) {
      console.error(`Error loading edit form for exercise ID ${req.params.id}:`, error);
      res.status(500).render('unit_form_views/error', {
        layout: 'unitformlayout',
        title: 'Error',
        errorMessage: 'An error occurred while loading the edit form.',
      });
    }
  });
  

  router.post(
    '/submit_exercise',
    ensureAuthenticated,
    uploadDocs.array('document_uploads', 3), // ✅ multer FIRST
    csrfProtection,                          // ✅ csrf AFTER multer
    unitFormController.submitExercise
  );



// Success Page Route
router.get('/success', ensureAuthenticated, unitFormController.showSuccessPage);

module.exports = router;







